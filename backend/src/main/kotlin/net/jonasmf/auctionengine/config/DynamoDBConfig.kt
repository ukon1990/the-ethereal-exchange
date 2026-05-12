package net.jonasmf.auctionengine.config

import io.awspring.cloud.dynamodb.DefaultDynamoDbTableNameResolver
import io.awspring.cloud.dynamodb.DynamoDbTableNameResolver
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.beans.factory.config.BeanDefinition
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.context.annotation.Role
import software.amazon.awssdk.services.dynamodb.DynamoDbClient

@Configuration(proxyBeanMethods = false)
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
class DynamoDBConfig {
    private val log = LoggerFactory.getLogger(DynamoDBConfig::class.java)

    @Value("\${spring.cloud.aws.dynamodb.endpoint:}")
    private val amazonDynamoDBEndpoint: String? = null

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    fun dynamoDbTableNameResolver(): DynamoDbTableNameResolver = DefaultDynamoDbTableNameResolver()

    @Bean
    @Profile("!production")
    fun dynamoDbTableInitializer(dynamoDbClient: DynamoDbClient): ApplicationRunner =
        ApplicationRunner {
            val endpoint = amazonDynamoDBEndpoint?.trim().orEmpty()
            if (endpoint.isEmpty()) {
                log.info("Skipping DynamoDB local table bootstrap because no local endpoint is configured")
                return@ApplicationRunner
            }

            log.info("No DynamoDB auction-house tables are configured for bootstrap at {}", endpoint)

            // Keep this shape as a reference for future DynamoDB-backed features, such as user management.
            //
            // val tables =
            //     listOf(
            //         UserDynamo.createTableRequest(),
            //     )
            // val tableNames =
            //     listOf(
            //         USER_TABLE_NAME,
            //     )
            //
            // runBlocking {
            //     tables.forEach { table ->
            //         try {
            //             dynamoDbClient.createTable(table)
            //         } catch (_: ResourceInUseException) {
            //             log.info("DynamoDB table {} already exists at {}", table.tableName(), endpoint)
            //         }
            //     }
            //
            //     repeat(20) {
            //         val tableStatuses =
            //             tableNames.map { tableName ->
            //                 dynamoDbClient.describeTable(
            //                     DescribeTableRequest.builder().tableName(tableName).build(),
            //                 ).table()?.tableStatus()
            //             }
            //         if (tableStatuses.all { it == TableStatus.ACTIVE }) {
            //             return@runBlocking
            //         }
            //         delay(500)
            //     }
            // }
        }
}
