package net.jonasmf.auctionengine.testsupport.builder

import net.jonasmf.auctionengine.constant.GameBuildVersion
import net.jonasmf.auctionengine.constant.Locale
import net.jonasmf.auctionengine.domain.realm.Realm
import net.jonasmf.auctionengine.constant.Region as RegionConstant
import net.jonasmf.auctionengine.domain.realm.Region as RealmRegion

fun buildRealm(
    id: Int = 1,
    name: String = "Test Realm",
    slug: String = "test-realm",
    region: RealmRegion = RealmRegion(id = 2, name = "Europe", type = RegionConstant.Europe),
    category: String = "Normal",
    locale: Locale = Locale.EN_GB,
    timezone: String = "UTC",
    gameBuild: GameBuildVersion = GameBuildVersion.RETAIL,
): Realm =
    Realm(
        id = id,
        name = name,
        slug = slug,
        region = region,
        category = category,
        locale = locale,
        timezone = timezone,
        gameBuild = gameBuild,
    )
