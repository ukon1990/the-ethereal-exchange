package net.jonasmf.auctionengine.service

import net.jonasmf.auctionengine.config.BlizzardApiProperties
import net.jonasmf.auctionengine.constant.Region
import org.slf4j.LoggerFactory
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.core.scheduler.Schedulers

private const val MEDIA_BACKFILL_CHUNK_SIZE = 500
private const val MEDIA_BACKFILL_CONCURRENCY = 10

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
            updates +=
                Flux
                    .fromIterable(rows)
                    .flatMap({ row ->
                        Mono
                            .fromCallable { resolveAndUpdate(region, tableName, type, row) }
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
    ): Boolean {
        val sourceHref = sourceHref(row)
        val resolved = blizzardMediaService.resolve(region, type, row.mediaLookupId, sourceHref, row.id) ?: return false
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
        return true
    }

    private fun sourceHref(row: MediaBackfillRow): String? =
        row.mediaSourceUrl
            ?: row.mediaUrl?.takeIf { it.contains("/data/wow/media/") }
}
