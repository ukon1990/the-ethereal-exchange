package net.jonasmf.auctionengine.mapper.realm

import net.jonasmf.auctionengine.domain.realm.AuctionHouse as AuctionHouseDomain
import net.jonasmf.auctionengine.dbo.rds.realm.AuctionHouse as AuctionHouseDbo
import kotlin.time.toJavaInstant
import kotlin.time.toKotlinInstant

fun AuctionHouseDbo.toDomain() =
    AuctionHouseDomain(
        id = connectedId,
        connectedId = connectedId,
        region = region,
        autoUpdate = autoUpdate,
        avgDelay = avgDelay ?: 0L,
        gameBuild = gameBuild ?: 0,
        highestDelay = highestDelay ?: 0L,
        lastDailyPriceUpdate = lastDailyPriceUpdate?.toKotlinInstant(),
        lastHistoryDeleteEvent = lastHistoryDeleteEvent?.toKotlinInstant(),
        lastHistoryDeleteEventDaily = lastHistoryDeleteEventDaily?.toKotlinInstant(),
        lastModified = lastModified?.toKotlinInstant(),
        lastRequested = lastRequested?.toKotlinInstant(),
        lowestDelay = lowestDelay ?: 0L,
        nextUpdate = nextUpdate?.toKotlinInstant(),
        updateAttempts = updateAttempts ?: 0,
    )

fun AuctionHouseDomain.toDbo() =
    AuctionHouseDbo(
        connectedId = connectedId.takeIf { it != 0 } ?: id ?: 0,
        region = region,
        autoUpdate = autoUpdate,
        avgDelay = avgDelay,
        gameBuild = gameBuild,
        highestDelay = highestDelay,
        lastDailyPriceUpdate = lastDailyPriceUpdate?.toJavaInstant(),
        lastHistoryDeleteEvent = lastHistoryDeleteEvent?.toJavaInstant(),
        lastHistoryDeleteEventDaily = lastHistoryDeleteEventDaily?.toJavaInstant(),
        lastModified = lastModified?.toJavaInstant(),
        lastRequested = lastRequested?.toJavaInstant(),
        lowestDelay = lowestDelay,
        nextUpdate = nextUpdate?.toJavaInstant(),
        updateAttempts = updateAttempts,
    )
