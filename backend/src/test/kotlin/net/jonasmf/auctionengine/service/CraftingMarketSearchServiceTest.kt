package net.jonasmf.auctionengine.service

import net.jonasmf.auctionengine.config.IntegrationTestBase
import net.jonasmf.auctionengine.testsupport.MarketSearchTestFixtures
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.web.server.ResponseStatusException
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate

class CraftingMarketSearchServiceTest : IntegrationTestBase() {
    @Autowired
    lateinit var jdbcTemplate: JdbcTemplate

    @Autowired
    lateinit var craftingMarketSearchService: CraftingMarketSearchService

    @Test
    fun `crafting search returns recipe variant with profit roi and trend`() {
        MarketSearchTestFixtures.seedMarketSearchData(jdbcTemplate)
        MarketSearchTestFixtures.augmentMarketSearchDataForCrafting(jdbcTemplate)

        val result =
            craftingMarketSearchService.search(
                regionCode = "eu",
                realmSlug = "argent-dawn",
                localeOverride = null,
                page = 0,
                pageSize = 10,
                sortBy = "itemName",
                sortDirection = "asc",
                query = null,
                professionIds = null,
                minProfit = null,
                maxProfit = null,
                minRoiPercent = null,
                maxRoiPercent = null,
                minReagentCost = null,
                maxReagentCost = null,
                minOutputPrice = null,
                maxOutputPrice = null,
                minOutputPriceChangePercent = null,
                maxOutputPriceChangePercent = null,
                requireCompleteReagentPricing = false,
            )

        assertEquals(1L, result.page.totalItems)
        val row = result.items.single()
        assertEquals(7001, row.recipeId)
        assertEquals("Healing Potion", row.item?.name)
        assertEquals(1_000L, row.outputPriceCopper)
        assertEquals(100L, row.reagentCostCopper)
        assertEquals(900L, row.profitCopper)
        assertNotNull(row.roiPercent)
        assertTrue(row.roiPercent!! > 800.0)
        assertNotNull(row.outputPriceChangePercent)
        assertEquals(25.0, row.outputPriceChangePercent!!, 0.01)
        assertTrue(row.reagentsFullyPriced)
        assertEquals("Alchemy", row.professionName)
    }

    @Test
    fun `crafting filters rejects inverted profit range`() {
        MarketSearchTestFixtures.seedMarketSearchData(jdbcTemplate)
        MarketSearchTestFixtures.augmentMarketSearchDataForCrafting(jdbcTemplate)

        assertThrows<ResponseStatusException> {
            craftingMarketSearchService.search(
                regionCode = "eu",
                realmSlug = "argent-dawn",
                localeOverride = null,
                page = 0,
                pageSize = 10,
                sortBy = "itemName",
                sortDirection = "asc",
                query = null,
                professionIds = null,
                minProfit = 100L,
                maxProfit = 50L,
                minRoiPercent = null,
                maxRoiPercent = null,
                minReagentCost = null,
                maxReagentCost = null,
                minOutputPrice = null,
                maxOutputPrice = null,
                minOutputPriceChangePercent = null,
                maxOutputPriceChangePercent = null,
                requireCompleteReagentPricing = false,
            )
        }
    }
}
