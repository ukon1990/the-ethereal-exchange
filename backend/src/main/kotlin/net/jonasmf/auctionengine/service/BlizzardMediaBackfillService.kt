package net.jonasmf.auctionengine.service

import net.jonasmf.auctionengine.config.BlizzardApiProperties
import net.jonasmf.auctionengine.constant.Region
import net.jonasmf.auctionengine.repository.rds.ItemFetchFailureState
import net.jonasmf.auctionengine.repository.rds.ItemJdbcRepository
import org.slf4j.LoggerFactory
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.core.scheduler.Schedulers
import java.time.Clock
import java.time.Duration
import java.time.OffsetDateTime

private const val MEDIA_BACKFILL_CHUNK_SIZE = 500
private const val MEDIA_BACKFILL_CONCURRENCY = 10
private const val MEDIA_BACKFILL_DISABLE_FAILURE_COUNT = 10
private val MEDIA_BACKFILL_BASE_BACKOFF: Duration = Duration.ofHours(1)
private val MEDIA_BACKFILL_MAX_BACKOFF: Duration = Duration.ofDays(7)

private data class MediaBackfillRow(
    val id: Int,
    val mediaLookupId: Int,
    val mediaUrl: String?,
    val mediaSourceUrl: String?,
)

data class BlizzardMediaBackfillResult(
    val region: Region,
    val itemUpdates: Int,
    val itemAppearanceUpdates: Int,
    val recipeUpdates: Int,
    val professionUpdates: Int,
) {
    val totalUpdates: Int = itemUpdates + itemAppearanceUpdates + recipeUpdates + professionUpdates
}

@Service
class BlizzardMediaBackfillService(
    private val properties: BlizzardApiProperties,
    private val jdbcTemplate: JdbcTemplate,
    private val blizzardMediaService: BlizzardMediaService,
    private val itemJdbcRepository: ItemJdbcRepository,
    private val clock: Clock = Clock.systemDefaultZone(),
) {
    private val log = LoggerFactory.getLogger(BlizzardMediaBackfillService::class.java)

    fun backfillConfiguredStaticDataRegion(): BlizzardMediaBackfillResult = backfillRegion(properties.staticDataRegion)

    fun backfillRegion(region: Region): BlizzardMediaBackfillResult =
        BlizzardMediaBackfillResult(
            region = region,
            itemUpdates = backfillTable(region, "item", BlizzardMediaType.ITEM),
            itemAppearanceUpdates = backfillTable(region, "item_appearance", BlizzardMediaType.ITEM_APPEARANCE),
            recipeUpdates = backfillTable(region, "recipe", BlizzardMediaType.RECIPE),
            professionUpdates = backfillTable(region, "profession", BlizzardMediaType.PROFESSION),
        ).also { result ->
            log.info(
                "Finished Blizzard media backfill region={} itemUpdates={} itemAppearanceUpdates={} recipeUpdates={} professionUpdates={} totalUpdates={}",
                result.region,
                result.itemUpdates,
                result.itemAppearanceUpdates,
                result.recipeUpdates,
                result.professionUpdates,
                result.totalUpdates,
            )
        }

    private fun backfillTable(
        region: Region,
        tableName: String,
        type: BlizzardMediaType,
    ): Int {
        var offset = 0
        var updates = 0
        while (true) {
            val rows = readRows(tableName, offset)
            if (rows.isEmpty()) break
            val now = OffsetDateTime.now(clock)
            val retryableRows =
                if (tableName == "item") {
                    val eligibility = itemJdbcRepository.classifyItemRetryEligibility(rows.map(MediaBackfillRow::id), now)
                    val retryableIds = eligibility.retryableIds.toSet()
                    log.info(
                        "Media backfill eligibility table={} chunkOffset={} chunkSize={} retryable={} cooldownSkipped={} manualDisabledSkipped={}",
                        tableName,
                        offset,
                        rows.size,
                        retryableIds.size,
                        eligibility.cooldownSkippedIds.size,
                        eligibility.manualDisabledIds.size,
                    )
                    rows.filter { retryableIds.contains(it.id) }
                } else {
                    rows
                }
            val existingFailureStates =
                if (tableName == "item") {
                    itemJdbcRepository
                        .findItemFetchFailureStates(retryableRows.map(MediaBackfillRow::id))
                        .toMutableMap()
                } else {
                    mutableMapOf()
                }
            updates +=
                Flux
                    .fromIterable(retryableRows)
                    .flatMap({ row ->
                        Mono
                            .fromCallable {
                                resolveAndUpdate(
                                    region = region,
                                    tableName = tableName,
                                    type = type,
                                    row = row,
                                    existingFailureStates = existingFailureStates,
                                )
                            }
                            .subscribeOn(Schedulers.boundedElastic())
                    }, MEDIA_BACKFILL_CONCURRENCY)
                    .collectList()
                    .block()
                    .orEmpty()
                    .count { it }
            offset += rows.size
        }
        return updates
    }

    private fun readRows(
        tableName: String,
        offset: Int,
    ): List<MediaBackfillRow> {
        val mediaLookupExpression =
            if (tableName == "item_appearance") {
                "item_display_info_id"
            } else {
                "id"
            }
        return jdbcTemplate.query(
            """
            SELECT id, $mediaLookupExpression AS media_lookup_id, media_url, media_source_url
            FROM `$tableName`
            ORDER BY id
            LIMIT ? OFFSET ?
            """.trimIndent(),
            { rs, _ ->
                MediaBackfillRow(
                    id = rs.getInt("id"),
                    mediaLookupId = rs.getInt("media_lookup_id"),
                    mediaUrl = rs.getString("media_url"),
                    mediaSourceUrl = rs.getString("media_source_url"),
                )
            },
            MEDIA_BACKFILL_CHUNK_SIZE,
            offset,
        )
    }

    private fun resolveAndUpdate(
        region: Region,
        tableName: String,
        type: BlizzardMediaType,
        row: MediaBackfillRow,
        existingFailureStates: MutableMap<Int, ItemFetchFailureState>,
    ): Boolean {
        val sourceHref = sourceHref(row)
        val resolved = blizzardMediaService.resolve(region, type, row.mediaLookupId, sourceHref, row.id)
        if (resolved != null) {
            jdbcTemplate.update(
                """
                UPDATE `$tableName`
                SET media_url = ?, media_source_url = ?
                WHERE id = ?
                """.trimIndent(),
                resolved.mediaUrl,
                resolved.mediaSourceUrl,
                row.id,
            )
            if (tableName == "item") {
                itemJdbcRepository.clearItemFetchFailureStates(listOf(row.id))
            }
            return true
        }

        if (tableName == "item") {
            val failedAt = OffsetDateTime.now(clock)
            val previousFailureCount = existingFailureStates[row.id]?.failureCount ?: 0
            val currentFailureCount = previousFailureCount + 1
            val manualDisabled = currentFailureCount >= MEDIA_BACKFILL_DISABLE_FAILURE_COUNT
            val nextRetryAt =
                if (manualDisabled) {
                    null
                } else {
                    failedAt.plus(backoffForFailureCount(currentFailureCount))
                }
            itemJdbcRepository.upsertItemFetchFailureState(
                itemId = row.id,
                failureCount = currentFailureCount,
                lastErrorStatus = null,
                lastErrorMessage = "media resolution returned null",
                lastFailedAt = failedAt,
                nextRetryAt = nextRetryAt,
                manualDisabled = manualDisabled,
            )
            existingFailureStates[row.id] =
                ItemFetchFailureState(
                    itemId = row.id,
                    failureCount = currentFailureCount,
                    lastErrorStatus = null,
                    lastErrorMessage = "media resolution returned null",
                    lastFailedAt = failedAt,
                    nextRetryAt = nextRetryAt,
                    manualDisabled = manualDisabled,
                )
        }
        return false
    }

    private fun backoffForFailureCount(failureCount: Int): Duration {
        val shift = (failureCount - 1).coerceAtLeast(0)
        val exponential = if (shift >= 62) Long.MAX_VALUE else 1L shl shift
        val backoff = MEDIA_BACKFILL_BASE_BACKOFF.multipliedBy(exponential)
        return if (backoff > MEDIA_BACKFILL_MAX_BACKOFF) MEDIA_BACKFILL_MAX_BACKOFF else backoff
    }

    private fun sourceHref(row: MediaBackfillRow): String? =
        row.mediaSourceUrl
            ?: row.mediaUrl?.takeIf { it.contains("/data/wow/media/") }
}
