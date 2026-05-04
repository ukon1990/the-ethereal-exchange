ALTER TABLE `item`
    ADD COLUMN `media_source_url` varchar(512) DEFAULT NULL;

ALTER TABLE `item_appearance`
    ADD COLUMN `media_source_url` varchar(512) DEFAULT NULL;

ALTER TABLE `profession`
    ADD COLUMN `media_source_url` varchar(512) DEFAULT NULL;

ALTER TABLE `recipe`
    ADD COLUMN `media_source_url` varchar(512) DEFAULT NULL;
