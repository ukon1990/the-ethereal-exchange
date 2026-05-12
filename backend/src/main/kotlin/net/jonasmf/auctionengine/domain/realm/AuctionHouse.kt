package net.jonasmf.auctionengine.domain.realm

import net.jonasmf.auctionengine.constant.Region
import kotlin.time.Instant

class AuctionHouse(
    var id: Int?,
    var region: Region = Region.Europe,
    var autoUpdate: Boolean = false,
    var avgDelay: Long = 0,
    var connectedId: Int = 0,
    var gameBuild: Int = 0,
    var highestDelay: Long = 0,
    var lastDailyPriceUpdate: Instant? = null,
    var lastHistoryDeleteEvent: Instant? = null,
    var lastHistoryDeleteEventDaily: Instant? = null,
    var lastModified: Instant? = null,
    var lastRequested: Instant? = null,
    var lowestDelay: Long = 0,
    var nextUpdate: Instant? = null,
    var realms: List<Realm> = emptyList(),
    var updateAttempts: Int = 0,
)

class Realm(
    val id: Long = 0,
    val locale: String = "",
    val name: String = "",
    val slug: String = "",
    val timezone: String = "",
)
