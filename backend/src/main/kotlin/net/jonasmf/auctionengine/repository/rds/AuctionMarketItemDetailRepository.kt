package net.jonasmf.auctionengine.repository.rds

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneOffset

data class AuctionMarketItemDetailDailyRow(
    val statDate: LocalDate,
    val pointTimestamp: OffsetDateTime,
    val minPrice: Long?,
    val avgPrice: Double?,
    val p25Price: Long?,
    val p75Price: Long?,
    val maxPrice: Long?,
    val minQuantity: Long?,
    val avgQuantity: Double?,
    val maxQuantity: Long?,
)

data class AuctionMarketItemDetailHourlyRow(
    val timestamp: OffsetDateTime,
    val hourOfDay: Int,
    val minPrice: Long?,
    val avgPrice: Double?,
    val p25Price: Long?,
    val p75Price: Long?,
    val maxPrice: Long?,
    val totalQuantity: Long?,
)

data class AuctionMarketItemDetailPieRow(
    val hourOfDay: Int,
    val quantity: Long?,
    val fraction: Double,
)

data class AuctionMarketItemHeaderRow(
    val itemId: Int,
    val itemName: String,
    val itemMediaUrl: String?,
    val qualityId: Int?,
    val qualityType: String?,
    val qualityName: String?,
    val itemClassId: Int?,
    val itemClassName: String?,
    val itemSubclassId: Int?,
    val itemSubclassName: String?,
    val recipeId: Int?,
    val recipeName: String?,
    val recipeMediaUrl: String?,
)

data class AuctionMarketItemCraftingRow(
    val recipeId: Int,
    val recipeName: String,
    val reagentCost: Long?,
    val buyout: Long?,
    val profit: Long?,
    val roiPercent: Double?,
)

@Repository
class AuctionMarketItemDetailRepository(
    private val jdbcTemplate: JdbcTemplate,
) {
    fun loadItemHeader(
        itemId: Int,
        localeColumnSuffix: String,
    ): AuctionMarketItemHeaderRow? =
        jdbcTemplate.query(
            """
            SELECT
                d.item_id,
                COALESCE(d.item_name_$localeColumnSuffix, d.item_name_en_gb, d.item_name_en_us) AS item_name,
                d.item_media_url,
                d.quality_id,
                d.quality_type,
                COALESCE(d.quality_name_$localeColumnSuffix, d.quality_name_en_gb, d.quality_name_en_us) AS quality_name,
                d.item_class_id,
                COALESCE(d.item_class_name_$localeColumnSuffix, d.item_class_name_en_gb, d.item_class_name_en_us) AS item_class_name,
                d.item_subclass_id,
                COALESCE(d.item_subclass_name_$localeColumnSuffix, d.item_subclass_name_en_gb, d.item_subclass_name_en_us) AS item_subclass_name,
                d.recipe_id,
                COALESCE(d.recipe_name_$localeColumnSuffix, d.recipe_name_en_gb, d.recipe_name_en_us) AS recipe_name,
                d.recipe_media_url
            FROM v_auction_market_item_details d
            WHERE d.item_id = ?
            LIMIT 1
            """.trimIndent(),
            headerRowMapper,
            itemId,
        ).firstOrNull()

    fun loadSnapshotPriceQuantity(
        connectedRealmId: Int,
        itemId: Int,
        statDate: LocalDate,
        hourOfDay: Int,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
    ): Pair<Long?, Long?> {
        val whereVar =
            if (variant) {
                "AND bonus_key <=> ? AND modifier_key <=> ? AND pet_species_id = ?"
            } else {
                ""
            }
        val sql =
            """
            SELECT MIN(price) AS price, SUM(quantity) AS qty
            FROM v_auction_house_prices
            WHERE connected_realm_id = ?
              AND item_id = ?
              AND date = ?
              AND hour_of_day = ?
              $whereVar
            """.trimIndent()
        val params: Array<Any?> =
            if (variant) {
                arrayOf(
                    connectedRealmId,
                    itemId,
                    java.sql.Date.valueOf(statDate),
                    hourOfDay,
                    bonusKey,
                    modifierKey,
                    petSpeciesId,
                )
            } else {
                arrayOf(
                    connectedRealmId,
                    itemId,
                    java.sql.Date.valueOf(statDate),
                    hourOfDay,
                )
            }
        return jdbcTemplate
            .query(sql, snapshotRowMapper, *params)
            .firstOrNull() ?: (null to null)
    }

    private val snapshotRowMapper =
        RowMapper { rs: ResultSet, _: Int ->
            rs.getNullableLong("price") to rs.getNullableLong("qty")
        }

    fun loadDailySeries(
        connectedRealmId: Int,
        itemId: Int,
        fromDate: LocalDate,
        toDate: LocalDate,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
    ): List<AuctionMarketItemDetailDailyRow> {
        val (sql, params) =
            buildDailySqlAndArgs(
                connectedRealmId,
                itemId,
                fromDate,
                toDate,
                variant,
                bonusKey,
                modifierKey,
                petSpeciesId,
            )
        return jdbcTemplate.query(sql, dailyRowMapper, *params)
    }

    fun loadHourlySeries(
        connectedRealmId: Int,
        itemId: Int,
        statDate: LocalDate,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
    ): List<AuctionMarketItemDetailHourlyRow> {
        val (sql, params) =
            buildHourlySqlAndArgs(
                connectedRealmId,
                itemId,
                statDate,
                variant,
                bonusKey,
                modifierKey,
                petSpeciesId,
            )
        return jdbcTemplate.query(sql, hourlyRowMapper, *params)
    }

    fun loadQuantityPie(
        connectedRealmId: Int,
        itemId: Int,
        statDate: LocalDate,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
    ): List<AuctionMarketItemDetailPieRow> {
        val (sql, params) =
            buildPieSqlAndArgs(
                connectedRealmId,
                itemId,
                statDate,
                variant,
                bonusKey,
                modifierKey,
                petSpeciesId,
            )
        return jdbcTemplate.query(sql, pieRowMapper, *params)
    }

    fun loadBestCrafting(
        connectedRealmId: Int,
        itemId: Int,
        statDate: LocalDate,
        hourOfDay: Int,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
        localeColumnSuffix: String,
    ): AuctionMarketItemCraftingRow? {
        val (sql, params) =
            buildCraftingSqlAndArgs(
                connectedRealmId,
                itemId,
                statDate,
                hourOfDay,
                variant,
                bonusKey,
                modifierKey,
                petSpeciesId,
                localeColumnSuffix,
            )
        return jdbcTemplate.query(sql, craftingRowMapper, *params).firstOrNull()
    }

    private val headerRowMapper =
        RowMapper { rs: ResultSet, _: Int ->
            AuctionMarketItemHeaderRow(
                itemId = rs.getInt("item_id"),
                itemName = rs.getString("item_name"),
                itemMediaUrl = rs.getString("item_media_url"),
                qualityId = rs.getNullableInt("quality_id"),
                qualityType = rs.getString("quality_type"),
                qualityName = rs.getString("quality_name"),
                itemClassId = rs.getNullableInt("item_class_id"),
                itemClassName = rs.getString("item_class_name"),
                itemSubclassId = rs.getNullableInt("item_subclass_id"),
                itemSubclassName = rs.getString("item_subclass_name"),
                recipeId = rs.getNullableInt("recipe_id"),
                recipeName = rs.getString("recipe_name"),
                recipeMediaUrl = rs.getString("recipe_media_url"),
            )
        }

    private val dailyRowMapper =
        RowMapper { rs: ResultSet, _: Int ->
            val d = rs.getObject("stat_date", LocalDate::class.java)
            AuctionMarketItemDetailDailyRow(
                statDate = d,
                pointTimestamp = d.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime(),
                minPrice = rs.getNullableLong("min_price"),
                avgPrice = rs.getNullableDouble("avg_price"),
                p25Price = rs.getNullableLong("p25_price"),
                p75Price = rs.getNullableLong("p75_price"),
                maxPrice = rs.getNullableLong("max_price"),
                minQuantity = rs.getNullableLong("min_quantity"),
                avgQuantity = rs.getNullableDouble("avg_quantity"),
                maxQuantity = rs.getNullableLong("max_quantity"),
            )
        }

    private val hourlyRowMapper =
        RowMapper { rs: ResultSet, _: Int ->
            val ts = rs.getTimestamp("timestamp").toInstant().atOffset(ZoneOffset.UTC)
            AuctionMarketItemDetailHourlyRow(
                timestamp = ts,
                hourOfDay = rs.getInt("hour_of_day"),
                minPrice = rs.getNullableLong("min_price"),
                avgPrice = rs.getNullableDouble("avg_price"),
                p25Price = rs.getNullableLong("p25_price"),
                p75Price = rs.getNullableLong("p75_price"),
                maxPrice = rs.getNullableLong("max_price"),
                totalQuantity = rs.getNullableLong("total_quantity"),
            )
        }

    private val pieRowMapper =
        RowMapper { rs: ResultSet, _: Int ->
            AuctionMarketItemDetailPieRow(
                hourOfDay = rs.getInt("hour_of_day"),
                quantity = rs.getNullableLong("quantity"),
                fraction = rs.getDouble("fraction"),
            )
        }

    private val craftingRowMapper =
        RowMapper { rs: ResultSet, _: Int ->
            AuctionMarketItemCraftingRow(
                recipeId = rs.getInt("recipe_id"),
                recipeName = rs.getString("recipe_name") ?: "",
                reagentCost = rs.getNullableLong("reagent_cost"),
                buyout = rs.getNullableLong("buyout"),
                profit = rs.getNullableLong("profit"),
                roiPercent = rs.getNullableDouble("roi_percent"),
            )
        }

    private fun ResultSet.getNullableInt(column: String): Int? {
        val v = getInt(column)
        return if (wasNull()) null else v
    }

    private fun ResultSet.getNullableLong(column: String): Long? {
        val v = getLong(column)
        return if (wasNull()) null else v
    }

    private fun ResultSet.getNullableDouble(column: String): Double? {
        val v = getDouble(column)
        return if (wasNull()) null else v
    }

    internal fun buildDailySqlAndArgs(
        connectedRealmId: Int,
        itemId: Int,
        fromDate: LocalDate,
        toDate: LocalDate,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
    ): Pair<String, Array<Any?>> {
        val sql =
            if (variant) {
                """
                WITH priced AS (
                    SELECT
                        v.date,
                        v.price,
                        v.quantity,
                        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY v.price) OVER (
                            PARTITION BY v.connected_realm_id, v.item_id, v.bonus_key, v.modifier_key, v.pet_species_id, v.date
                        ) AS p25_price,
                        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY v.price) OVER (
                            PARTITION BY v.connected_realm_id, v.item_id, v.bonus_key, v.modifier_key, v.pet_species_id, v.date
                        ) AS p75_price
                    FROM v_auction_house_prices v
                    WHERE v.connected_realm_id = ?
                      AND v.item_id = ?
                      AND v.date BETWEEN ? AND ?
                      AND v.bonus_key <=> ?
                      AND v.modifier_key <=> ?
                      AND v.pet_species_id = ?
                )
                SELECT
                    date AS stat_date,
                    MIN(price) AS min_price,
                    AVG(price) AS avg_price,
                    MIN(p25_price) AS p25_price,
                    MIN(p75_price) AS p75_price,
                    MAX(price) AS max_price,
                    MIN(quantity) AS min_quantity,
                    AVG(quantity) AS avg_quantity,
                    MAX(quantity) AS max_quantity
                FROM priced
                GROUP BY date
                ORDER BY date
                """.trimIndent()
            } else {
                """
                WITH priced AS (
                    SELECT
                        v.date,
                        v.price,
                        v.quantity,
                        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY v.price) OVER (
                            PARTITION BY v.connected_realm_id, v.item_id, v.date
                        ) AS p25_price,
                        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY v.price) OVER (
                            PARTITION BY v.connected_realm_id, v.item_id, v.date
                        ) AS p75_price
                    FROM v_auction_house_prices v
                    WHERE v.connected_realm_id = ?
                      AND v.item_id = ?
                      AND v.date BETWEEN ? AND ?
                )
                SELECT
                    date AS stat_date,
                    MIN(price) AS min_price,
                    AVG(price) AS avg_price,
                    MIN(p25_price) AS p25_price,
                    MIN(p75_price) AS p75_price,
                    MAX(price) AS max_price,
                    MIN(quantity) AS min_quantity,
                    AVG(quantity) AS avg_quantity,
                    MAX(quantity) AS max_quantity
                FROM priced
                GROUP BY date
                ORDER BY date
                """.trimIndent()
            }
        val params: Array<Any?> =
            if (variant) {
                arrayOf(
                    connectedRealmId,
                    itemId,
                    java.sql.Date.valueOf(fromDate),
                    java.sql.Date.valueOf(toDate),
                    bonusKey,
                    modifierKey,
                    petSpeciesId,
                )
            } else {
                arrayOf(
                    connectedRealmId,
                    itemId,
                    java.sql.Date.valueOf(fromDate),
                    java.sql.Date.valueOf(toDate),
                )
            }
        return sql to params
    }

    internal fun buildHourlySqlAndArgs(
        connectedRealmId: Int,
        itemId: Int,
        statDate: LocalDate,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
    ): Pair<String, Array<Any?>> {
        val sql =
            if (variant) {
                """
                WITH priced AS (
                    SELECT
                        v.timestamp,
                        v.hour_of_day,
                        v.price,
                        v.quantity,
                        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY v.price) OVER (
                            PARTITION BY v.connected_realm_id, v.item_id, v.bonus_key, v.modifier_key, v.pet_species_id, v.date, v.hour_of_day
                        ) AS p25_price,
                        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY v.price) OVER (
                            PARTITION BY v.connected_realm_id, v.item_id, v.bonus_key, v.modifier_key, v.pet_species_id, v.date, v.hour_of_day
                        ) AS p75_price
                    FROM v_auction_house_prices v
                    WHERE v.connected_realm_id = ?
                      AND v.item_id = ?
                      AND v.date = ?
                      AND v.bonus_key <=> ?
                      AND v.modifier_key <=> ?
                      AND v.pet_species_id = ?
                )
                SELECT
                    timestamp,
                    hour_of_day,
                    MIN(price) AS min_price,
                    AVG(price) AS avg_price,
                    MIN(p25_price) AS p25_price,
                    MIN(p75_price) AS p75_price,
                    MAX(price) AS max_price,
                    SUM(quantity) AS total_quantity
                FROM priced
                GROUP BY timestamp, hour_of_day
                ORDER BY hour_of_day
                """.trimIndent()
            } else {
                """
                WITH priced AS (
                    SELECT
                        v.timestamp,
                        v.hour_of_day,
                        v.price,
                        v.quantity,
                        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY v.price) OVER (
                            PARTITION BY v.connected_realm_id, v.item_id, v.date, v.hour_of_day
                        ) AS p25_price,
                        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY v.price) OVER (
                            PARTITION BY v.connected_realm_id, v.item_id, v.date, v.hour_of_day
                        ) AS p75_price
                    FROM v_auction_house_prices v
                    WHERE v.connected_realm_id = ?
                      AND v.item_id = ?
                      AND v.date = ?
                )
                SELECT
                    timestamp,
                    hour_of_day,
                    MIN(price) AS min_price,
                    AVG(price) AS avg_price,
                    MIN(p25_price) AS p25_price,
                    MIN(p75_price) AS p75_price,
                    MAX(price) AS max_price,
                    SUM(quantity) AS total_quantity
                FROM priced
                GROUP BY timestamp, hour_of_day
                ORDER BY hour_of_day
                """.trimIndent()
            }
        val params: Array<Any?> =
            if (variant) {
                arrayOf(
                    connectedRealmId,
                    itemId,
                    java.sql.Date.valueOf(statDate),
                    bonusKey,
                    modifierKey,
                    petSpeciesId,
                )
            } else {
                arrayOf(
                    connectedRealmId,
                    itemId,
                    java.sql.Date.valueOf(statDate),
                )
            }
        return sql to params
    }

    internal fun buildPieSqlAndArgs(
        connectedRealmId: Int,
        itemId: Int,
        statDate: LocalDate,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
    ): Pair<String, Array<Any?>> {
        val whereVariant =
            if (variant) {
                "AND v.bonus_key <=> ? AND v.modifier_key <=> ? AND v.pet_species_id = ?"
            } else {
                ""
            }
        val sql =
            """
            WITH hours AS (
                SELECT v.hour_of_day, SUM(v.quantity) AS qty
                FROM v_auction_house_prices v
                WHERE v.connected_realm_id = ?
                  AND v.item_id = ?
                  AND v.date = ?
                  $whereVariant
                GROUP BY v.hour_of_day
            ),
            total AS (
                SELECT COALESCE(SUM(qty), 0) AS t FROM hours
            )
            SELECT
                h.hour_of_day,
                h.qty AS quantity,
                CASE WHEN total.t > 0 THEN h.qty / total.t ELSE 0 END AS fraction
            FROM hours h
            CROSS JOIN total
            ORDER BY h.hour_of_day
            """.trimIndent()
        val params: Array<Any?> =
            if (variant) {
                arrayOf(
                    connectedRealmId,
                    itemId,
                    java.sql.Date.valueOf(statDate),
                    bonusKey,
                    modifierKey,
                    petSpeciesId,
                )
            } else {
                arrayOf(
                    connectedRealmId,
                    itemId,
                    java.sql.Date.valueOf(statDate),
                )
            }
        return sql to params
    }

    internal fun buildCraftingSqlAndArgs(
        connectedRealmId: Int,
        itemId: Int,
        statDate: LocalDate,
        hourOfDay: Int,
        variant: Boolean,
        bonusKey: String,
        modifierKey: String,
        petSpeciesId: Int,
        localeColumnSuffix: String,
    ): Pair<String, Array<Any?>> {
        val priceCte =
            if (variant) {
                """
                current_prices AS (
                    SELECT item_id, MIN(price) AS price
                    FROM v_auction_house_prices
                    WHERE connected_realm_id = ?
                      AND date = ?
                      AND hour_of_day = ?
                      AND bonus_key <=> ?
                      AND modifier_key <=> ?
                      AND pet_species_id = ?
                    GROUP BY item_id
                )
                """.trimIndent()
            } else {
                """
                current_prices AS (
                    SELECT item_id, MIN(price) AS price
                    FROM v_auction_house_prices
                    WHERE connected_realm_id = ?
                      AND date = ?
                      AND hour_of_day = ?
                    GROUP BY item_id
                )
                """.trimIndent()
            }
        val sql =
            """
            WITH
            $priceCte,
            recipe_cost AS (
                SELECT rr.recipe_id, SUM(cp.price * rr.quantity) AS reagent_cost
                FROM recipe_reagent rr
                JOIN current_prices cp ON cp.item_id = rr.item_id
                GROUP BY rr.recipe_id
            )
            SELECT
                r.id AS recipe_id,
                COALESCE(l.$localeColumnSuffix, l.en_gb, l.en_us, CAST(r.id AS CHAR)) AS recipe_name,
                rc.reagent_cost,
                cp.price AS buyout,
                (cp.price - rc.reagent_cost) AS profit,
                CASE
                    WHEN rc.reagent_cost IS NOT NULL AND rc.reagent_cost > 0 AND cp.price IS NOT NULL
                    THEN 100.0 * (cp.price - rc.reagent_cost) / rc.reagent_cost
                    ELSE NULL
                END AS roi_percent
            FROM recipe r
            JOIN current_prices cp ON cp.item_id = r.crafted_item_id
            LEFT JOIN recipe_cost rc ON rc.recipe_id = r.id
            LEFT JOIN locale l ON l.id = r.name_id
            WHERE r.crafted_item_id = ?
            ORDER BY (profit IS NULL), profit DESC
            LIMIT 1
            """.trimIndent()
        val priceParams: Array<Any?> =
            if (variant) {
                arrayOf(
                    connectedRealmId,
                    java.sql.Date.valueOf(statDate),
                    hourOfDay,
                    bonusKey,
                    modifierKey,
                    petSpeciesId,
                )
            } else {
                arrayOf(
                    connectedRealmId,
                    java.sql.Date.valueOf(statDate),
                    hourOfDay,
                )
            }
        return sql to arrayOf(*priceParams, itemId)
    }
}
