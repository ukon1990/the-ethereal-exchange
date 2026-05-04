package net.jonasmf.auctionengine.service

import net.jonasmf.auctionengine.generated.model.AuctionListingKey
import net.jonasmf.auctionengine.generated.model.AuctionMarketItem
import net.jonasmf.auctionengine.generated.model.AuctionMarketItemCrafting
import net.jonasmf.auctionengine.generated.model.AuctionMarketItemDetailPoint
import net.jonasmf.auctionengine.generated.model.AuctionMarketItemDetailResponse
import net.jonasmf.auctionengine.generated.model.AuctionMarketItemDetailSummary
import net.jonasmf.auctionengine.generated.model.AuctionMarketItemHourlyPoint
import net.jonasmf.auctionengine.generated.model.AuctionMarketMetrics
import net.jonasmf.auctionengine.generated.model.AuctionMarketNamedId
import net.jonasmf.auctionengine.generated.model.AuctionMarketQuantityPieSlice
import net.jonasmf.auctionengine.generated.model.AuctionMarketRecipe
import net.jonasmf.auctionengine.generated.model.MarketDataSource
import net.jonasmf.auctionengine.repository.rds.AuctionMarketItemDetailDailyRow
import net.jonasmf.auctionengine.repository.rds.AuctionMarketItemDetailHourlyRow
import net.jonasmf.auctionengine.repository.rds.AuctionMarketItemDetailPieRow
import net.jonasmf.auctionengine.repository.rds.AuctionMarketItemDetailRepository
import net.jonasmf.auctionengine.repository.rds.AuctionMarketItemCraftingRow
import net.jonasmf.auctionengine.repository.rds.AuctionMarketItemHeaderRow
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.OffsetDateTime
import java.time.ZoneOffset

@Service
class AuctionMarketItemDetailService(
    private val auctionMarketContextService: AuctionMarketContextService,
    private val detailRepository: AuctionMarketItemDetailRepository,
) {
    fun itemDetail(
        regionCode: String,
        realmSlug: String,
        itemId: Int,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
        localeOverride: String?,
    ): AuctionMarketItemDetailResponse {
        val context = auctionMarketContextService.resolve(regionCode, realmSlug, localeOverride)
        val rollupListing = bonusKey.isEmpty() && modifierKey.isEmpty() && petSpeciesId == 0
        val variant = !rollupListing
        val localeSuffix = context.localeColumnSuffix

        val header =
            detailRepository.loadItemHeader(itemId, localeSuffix)
                ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found: $itemId")

        val listingKey = AuctionListingKey(bonusKey, modifierKey, petSpeciesId)
        val redundant =
            context.selectedSnapshot.connectedRealmId == context.communitySnapshot.connectedRealmId

        val realmFrom = context.selectedSnapshot.date.minusDays(13)
        val realmTo = context.selectedSnapshot.date
        val communityFrom = context.communitySnapshot.date.minusDays(13)
        val communityTo = context.communitySnapshot.date

        val dailyRealm =
            detailRepository
                .loadDailySeries(
                    context.selectedSnapshot.connectedRealmId,
                    itemId,
                    realmFrom,
                    realmTo,
                    variant,
                    bonusKey,
                    modifierKey,
                    petSpeciesId,
                ).map { it.toDetailPoint() }

        val dailyCommunity =
            if (redundant) {
                emptyList()
            } else {
                detailRepository
                    .loadDailySeries(
                        context.communitySnapshot.connectedRealmId,
                        itemId,
                        communityFrom,
                        communityTo,
                        variant,
                        bonusKey,
                        modifierKey,
                        petSpeciesId,
                    ).map { it.toDetailPoint() }
            }

        val hourlyRealm =
            detailRepository
                .loadHourlySeries(
                    context.selectedSnapshot.connectedRealmId,
                    itemId,
                    context.selectedSnapshot.date,
                    variant,
                    bonusKey,
                    modifierKey,
                    petSpeciesId,
                ).map { it.toHourlyPoint() }

        val hourlyCommunity =
            if (redundant) {
                emptyList()
            } else {
                detailRepository
                    .loadHourlySeries(
                        context.communitySnapshot.connectedRealmId,
                        itemId,
                        context.communitySnapshot.date,
                        variant,
                        bonusKey,
                        modifierKey,
                        petSpeciesId,
                    ).map { it.toHourlyPoint() }
            }

        val pieRealm =
            detailRepository.loadQuantityPie(
                context.selectedSnapshot.connectedRealmId,
                itemId,
                context.selectedSnapshot.date,
                variant,
                bonusKey,
                modifierKey,
                petSpeciesId,
            ).map { it.toPieSlice() }

        val pieCommunity =
            if (redundant) {
                emptyList()
            } else {
                detailRepository
                    .loadQuantityPie(
                        context.communitySnapshot.connectedRealmId,
                        itemId,
                        context.communitySnapshot.date,
                        variant,
                        bonusKey,
                        modifierKey,
                        petSpeciesId,
                    ).map { it.toPieSlice() }
            }

        val (selPrice, selQty) =
            detailRepository.loadSnapshotPriceQuantity(
                context.selectedSnapshot.connectedRealmId,
                itemId,
                context.selectedSnapshot.date,
                context.selectedSnapshot.hour,
                variant,
                bonusKey,
                modifierKey,
                petSpeciesId,
            )

        val (comPrice, comQty) =
            if (redundant) {
                selPrice to selQty
            } else {
                detailRepository.loadSnapshotPriceQuantity(
                    context.communitySnapshot.connectedRealmId,
                    itemId,
                    context.communitySnapshot.date,
                    context.communitySnapshot.hour,
                    variant,
                    bonusKey,
                    modifierKey,
                    petSpeciesId,
                )
            }

        val selectedMetrics =
            AuctionMarketMetrics(
                connectedRealmId = context.selectedSnapshot.connectedRealmId,
                timestamp = context.selectedSnapshot.timestamp,
                date = context.selectedSnapshot.date,
                hourOfDay = context.selectedSnapshot.hour,
                price = selPrice,
                quantity = selQty,
            )

        val communityMetrics =
            AuctionMarketMetrics(
                connectedRealmId = context.communitySnapshot.connectedRealmId,
                timestamp = context.communitySnapshot.timestamp,
                date = context.communitySnapshot.date,
                hourOfDay = context.communitySnapshot.hour,
                price = comPrice,
                quantity = comQty,
            )

        val summary =
            buildSummary(
                dailyRealm = dailyRealm,
                dailyCommunity = dailyCommunity,
                selectedRealmPrice = selPrice,
                selectedRealmQuantity = selQty,
                communityPrice = comPrice,
                communityQuantity = comQty,
                regionalMetricsRedundant = redundant,
            )

        val craftingRow =
            detailRepository.loadBestCrafting(
                context.selectedSnapshot.connectedRealmId,
                itemId,
                context.selectedSnapshot.date,
                context.selectedSnapshot.hour,
                variant,
                bonusKey,
                modifierKey,
                petSpeciesId,
                localeSuffix,
            )
        val craftingDto = craftingRow?.toCraftingDto()

        return AuctionMarketItemDetailResponse(
            item = header.toAuctionMarketItem(),
            listingKey = listingKey,
            rollupListing = rollupListing,
            regionalMetricsRedundant = redundant,
            marketDataSources = marketDataSources(context, redundant),
            selectedRealm = selectedMetrics,
            community = communityMetrics,
            summary = summary,
            dailySeriesRealm = dailyRealm,
            dailySeriesCommunity = dailyCommunity,
            hourlySeriesRealm = hourlyRealm,
            hourlySeriesCommunity = hourlyCommunity,
            quantityPieRealm = pieRealm,
            quantityPieCommunity = pieCommunity,
            crafting = craftingDto,
        )
    }

    private fun marketDataSources(
        context: MarketContext,
        redundant: Boolean,
    ): List<MarketDataSource> {
        val selected =
            MarketDataSource(
                connectedRealmId = context.selectedSnapshot.connectedRealmId,
                auctionHouseLastModified =
                    OffsetDateTime.ofInstant(context.selectedAuctionHouseLastModified, ZoneOffset.UTC),
            )
        return if (redundant) {
            listOf(selected)
        } else {
            val community =
                MarketDataSource(
                    connectedRealmId = context.communitySnapshot.connectedRealmId,
                    auctionHouseLastModified =
                        OffsetDateTime.ofInstant(context.communityAuctionHouseLastModified, ZoneOffset.UTC),
                )
            listOf(selected, community)
        }
    }

    private fun buildSummary(
        dailyRealm: List<AuctionMarketItemDetailPoint>,
        dailyCommunity: List<AuctionMarketItemDetailPoint>,
        selectedRealmPrice: Long?,
        selectedRealmQuantity: Long?,
        communityPrice: Long?,
        communityQuantity: Long?,
        regionalMetricsRedundant: Boolean,
    ): AuctionMarketItemDetailSummary {
        val realmPct = dayOverDayPercent(dailyRealm)
        val communityPct =
            if (regionalMetricsRedundant) {
                realmPct
            } else {
                dayOverDayPercent(dailyCommunity)
            }
        val realmVsCommunity =
            if (regionalMetricsRedundant || communityPrice == null || communityPrice == 0L) {
                null
            } else if (selectedRealmPrice == null) {
                null
            } else {
                100.0 * (selectedRealmPrice - communityPrice) / communityPrice.toDouble()
            }
        return AuctionMarketItemDetailSummary(
            selectedRealmPrice = selectedRealmPrice,
            selectedRealmQuantity = selectedRealmQuantity,
            communityPrice = communityPrice,
            communityQuantity = communityQuantity,
            selectedRealmPriceChangePercent = realmPct,
            communityPriceChangePercent = communityPct,
            realmVsCommunityPricePercent = realmVsCommunity,
        )
    }

    private fun dayOverDayPercent(daily: List<AuctionMarketItemDetailPoint>): Double? {
        if (daily.size < 2) return null
        val prev = daily[daily.size - 2].avgPrice ?: return null
        val cur = daily.last().avgPrice ?: return null
        if (prev == 0.0) return null
        return 100.0 * (cur - prev) / prev
    }

    private fun AuctionMarketItemHeaderRow.toAuctionMarketItem(): AuctionMarketItem =
        AuctionMarketItem(
            id = itemId,
            name = itemName,
            mediaUrl = itemMediaUrl,
            quality =
                qualityId?.let {
                    AuctionMarketNamedId(
                        it,
                        qualityName.orEmpty(),
                        qualityType,
                    )
                },
            itemClass =
                itemClassId?.let {
                    AuctionMarketNamedId(
                        it,
                        itemClassName.orEmpty(),
                    )
                },
            itemSubclass =
                itemSubclassId?.let {
                    AuctionMarketNamedId(
                        it,
                        itemSubclassName.orEmpty(),
                    )
                },
            recipe =
                recipeId?.let {
                    AuctionMarketRecipe(
                        id = it,
                        name = recipeName.orEmpty(),
                        mediaUrl = recipeMediaUrl,
                    )
                },
        )

    private fun AuctionMarketItemDetailDailyRow.toDetailPoint(): AuctionMarketItemDetailPoint =
        AuctionMarketItemDetailPoint(
            statDate = statDate,
            pointTimestamp = pointTimestamp,
            minPrice = minPrice,
            avgPrice = avgPrice,
            p25Price = p25Price,
            p75Price = p75Price,
            maxPrice = maxPrice,
            minQuantity = minQuantity,
            avgQuantity = avgQuantity,
            maxQuantity = maxQuantity,
        )

    private fun AuctionMarketItemDetailHourlyRow.toHourlyPoint(): AuctionMarketItemHourlyPoint =
        AuctionMarketItemHourlyPoint(
            timestamp = timestamp,
            hourOfDay = hourOfDay,
            minPrice = minPrice,
            avgPrice = avgPrice,
            p25Price = p25Price,
            p75Price = p75Price,
            maxPrice = maxPrice,
            totalQuantity = totalQuantity,
        )

    private fun AuctionMarketItemDetailPieRow.toPieSlice(): AuctionMarketQuantityPieSlice =
        AuctionMarketQuantityPieSlice(
            hourOfDay = hourOfDay,
            fraction = fraction,
            quantity = quantity,
        )

    private fun AuctionMarketItemCraftingRow.toCraftingDto(): AuctionMarketItemCrafting? {
        if (reagentCost == null || buyout == null) return null
        return AuctionMarketItemCrafting(
            recipeId = recipeId,
            recipeName = recipeName,
            reagentCost = reagentCost,
            buyout = buyout,
            profit = profit,
            roiPercent = roiPercent,
        )
    }
}
