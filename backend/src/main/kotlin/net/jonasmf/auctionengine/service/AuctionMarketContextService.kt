package net.jonasmf.auctionengine.service

import net.jonasmf.auctionengine.constant.Locale
import net.jonasmf.auctionengine.constant.Region
import net.jonasmf.auctionengine.dbo.rds.realm.ConnectedRealm
import net.jonasmf.auctionengine.dbo.rds.realm.Realm
import net.jonasmf.auctionengine.repository.rds.ConnectedRealmRepository
import net.jonasmf.auctionengine.utility.resolveZone
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId

data class MarketSnapshot(
    val connectedRealmId: Int,
    val date: LocalDate,
    val hour: Int,
    val timestamp: OffsetDateTime,
)

data class MarketContext(
    val selectedConnectedRealm: ConnectedRealm,
    val selectedRealm: Realm,
    val communityConnectedRealm: ConnectedRealm,
    val locale: Locale,
    val localeColumnSuffix: String,
    val selectedSnapshot: MarketSnapshot,
    val communitySnapshot: MarketSnapshot,
)

@Service
class AuctionMarketContextService(
    private val connectedRealmRepository: ConnectedRealmRepository,
) {
    fun resolve(
        regionCode: String,
        realmSlug: String,
        localeOverride: String?,
    ): MarketContext {
        val region =
            runCatching { Region.fromString(regionCode) }
                .getOrElse { throw ResponseStatusException(HttpStatus.BAD_REQUEST, it.message, it) }
        val (selectedConnectedRealm, selectedRealm) =
            connectedRealmRepository
                .findAllByRegion(region)
                .firstNotNullOfOrNull { connectedRealm ->
                    connectedRealm.realms
                        .firstOrNull { it.slug.equals(realmSlug, ignoreCase = true) }
                        ?.let { connectedRealm to it }
                } ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Realm not found: $regionCode/$realmSlug")
        val communityConnectedRealm =
            connectedRealmRepository
                .findById(CommunityRealms.idFor(region))
                .orElseThrow {
                    ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Community realm not found for $regionCode",
                    )
                }
        val locale = localeOverride?.takeIf { it.isNotBlank() }?.parseLocale() ?: selectedRealm.locale

        return MarketContext(
            selectedConnectedRealm = selectedConnectedRealm,
            selectedRealm = selectedRealm,
            communityConnectedRealm = communityConnectedRealm,
            locale = locale,
            localeColumnSuffix = locale.columnSuffix,
            selectedSnapshot = selectedConnectedRealm.snapshotFor(selectedRealm.timezone),
            communitySnapshot = communityConnectedRealm.snapshotFor(null),
        )
    }

    private fun ConnectedRealm.snapshotFor(preferredTimezone: String?): MarketSnapshot {
        val lastModified =
            auctionHouse.lastModified
                ?: throw ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Auction house ${auctionHouse.connectedId} has no last modified timestamp",
                )
        val zone = preferredTimezone?.toZoneIdOrNull() ?: resolveZone()
        val local = lastModified.atZone(zone)
        return MarketSnapshot(
            connectedRealmId = id,
            date = local.toLocalDate(),
            hour = local.hour,
            timestamp = local.toOffsetDateTime(),
        )
    }

    private fun String.toZoneIdOrNull(): ZoneId? = runCatching { ZoneId.of(this) }.getOrNull()

    private fun String.parseLocale(): Locale =
        runCatching { Locale.getAllValues().getValue(this) }
            .recoverCatching { Locale.fromCompactString(this) }
            .getOrElse { throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported locale: $this", it) }

    private val Locale.columnSuffix: String
        get() = value.lowercase()
}
