package net.jonasmf.auctionengine.mapper.realm

import net.jonasmf.auctionengine.dbo.rds.realm.ConnectedRealm as ConnectedRealmDbo
import net.jonasmf.auctionengine.dbo.rds.realm.AuctionHouse as AuctionHouseDbo
import net.jonasmf.auctionengine.domain.realm.ConnectedRealm as ConnectedRealmDomain

fun ConnectedRealmDbo.toDomain() = ConnectedRealmDomain (
    id = id,
)
fun ConnectedRealmDomain.toDbo() = ConnectedRealmDbo(
    id = id,
    auctionHouse = AuctionHouseDbo(connectedId = id),
)
