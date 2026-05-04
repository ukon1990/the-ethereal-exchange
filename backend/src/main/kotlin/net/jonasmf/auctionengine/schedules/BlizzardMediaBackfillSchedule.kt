package net.jonasmf.auctionengine.schedules

import net.jonasmf.auctionengine.config.BlizzardApiProperties
import net.jonasmf.auctionengine.config.WaeS3Properties
import net.jonasmf.auctionengine.service.BlizzardMediaBackfillService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.util.concurrent.atomic.AtomicBoolean

@Component
class BlizzardMediaBackfillSchedule(
    private val properties: BlizzardApiProperties,
    private val s3Properties: WaeS3Properties,
    private val blizzardMediaBackfillService: BlizzardMediaBackfillService,
    @Value("\${spring.cloud.aws.region.static}")
    private val deploymentAwsRegion: String,
) {
    private val log = LoggerFactory.getLogger(BlizzardMediaBackfillSchedule::class.java)
    private val backfillRunning = AtomicBoolean(false)

    @Scheduled(
        cron = "\${app.scheduling.media-backfill-cron:0 30 * * * *}",
        zone = "\${app.scheduling.media-backfill-zone:GMT+1}",
    )
    fun backfillMediaOnSchedule() {
        if (!shouldRunInCurrentDeploymentRegion("scheduled")) return
        runBackfill("scheduled")
    }

    @Scheduled(
        initialDelayString = "\${app.scheduling.media-backfill-startup-delay:PT2M}",
        fixedDelayString = "\${app.scheduling.media-backfill-startup-repeat-delay:P3650D}",
    )
    fun backfillMediaAfterStartup() {
        if (!shouldRunInCurrentDeploymentRegion("startup")) return
        runBackfill("startup")
    }

    fun backfillMedia() {
        runBackfill("manual")
    }

    private fun shouldRunInCurrentDeploymentRegion(trigger: String): Boolean {
        val expectedAwsRegion = s3Properties.bucketFor(properties.staticDataRegion).bucketRegion
        if (deploymentAwsRegion != expectedAwsRegion) {
            log.info(
                "Skipping {} media backfill because deployment AWS region {} does not match static data region {} bucket region {}.",
                trigger,
                deploymentAwsRegion,
                properties.staticDataRegion,
                expectedAwsRegion,
            )
            return false
        }
        return true
    }

    private fun runBackfill(trigger: String) {
        if (!backfillRunning.compareAndSet(false, true)) {
            log.info("Skipping {} media backfill because backfill already running.", trigger)
            return
        }

        try {
            log.info(
                "Starting {} media backfill for region {} (configured regions={})",
                trigger,
                properties.staticDataRegion,
                properties.configuredRegions,
            )
            val result = blizzardMediaBackfillService.backfillConfiguredStaticDataRegion()
            log.info(
                "Completed {} media backfill for region {} itemUpdates={} itemAppearanceUpdates={} recipeUpdates={} professionUpdates={} totalUpdates={}",
                trigger,
                result.region,
                result.itemUpdates,
                result.itemAppearanceUpdates,
                result.recipeUpdates,
                result.professionUpdates,
                result.totalUpdates,
            )
        } finally {
            backfillRunning.set(false)
        }
    }
}
