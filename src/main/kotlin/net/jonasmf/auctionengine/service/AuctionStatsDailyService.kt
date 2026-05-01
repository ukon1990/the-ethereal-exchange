package net.jonasmf.auctionengine.service

import net.jonasmf.auctionengine.dbo.dynamodb.converters.toKotlin
import net.jonasmf.auctionengine.repository.rds.AuctionStatsDailyJDBCRepository
import net.jonasmf.auctionengine.utility.datesBetween
import org.slf4j.LoggerFactory
import java.time.Instant
import java.time.LocalDate

class AuctionStatsDailyService(
    private val auctionStatsDailyJDBCRepository: AuctionStatsDailyJDBCRepository,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * For a given realm, then we check which days that do not have daily stats,
     * and upsert those.
     * Remember to update the timestamp in auction_house, so we can keep track of this info
     */
    fun updateForDate(connectedRealmId: Int, lastUpdated: LocalDate) {
        val startDate = lastUpdated.plus(1)
        val endDate = LocalDate.now().minusDays(1)
        val dates = datesBetween(startDate, endDate)
        val startTime = System.currentTimeMillis()
        dates.forEach { date ->
            logger.info("Updating daily price statistics for date: $date")
            val updatedRows = auctionStatsDailyJDBCRepository.upsertDailyPriceStatistics(connectedRealmId, date)
            val durationSeconds = (System.currentTimeMillis() - startTime) / 1000.0
            logger.info("Updated daily price statistics for date: $date, rows affected: $updatedRows, duration: ${"%.2f".format(durationSeconds)} seconds")
        }
    }}
}
