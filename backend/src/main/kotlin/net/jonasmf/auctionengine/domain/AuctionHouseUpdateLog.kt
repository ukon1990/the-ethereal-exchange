package net.jonasmf.auctionengine.domain

import kotlin.time.Instant

class AuctionHouseUpdateLog(
    val id: Int,
    val lastModified: Instant,
    val timeSincePreviousDump: Long,
)
