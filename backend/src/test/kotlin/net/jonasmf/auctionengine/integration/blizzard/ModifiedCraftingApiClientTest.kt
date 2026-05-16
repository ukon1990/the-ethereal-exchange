package net.jonasmf.auctionengine.integration.blizzard

import net.jonasmf.auctionengine.constant.Region
import net.jonasmf.auctionengine.testsupport.BlizzardApiCallSupport.Companion.buildWebClient
import net.jonasmf.auctionengine.testsupport.BlizzardApiCallSupport.Companion.createSupport
import net.jonasmf.auctionengine.testsupport.BlizzardApiCallSupport.Companion.okJson
import net.jonasmf.auctionengine.testsupport.loadFixture
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.web.reactive.function.client.ClientRequest
import org.springframework.web.reactive.function.client.ClientResponse
import reactor.core.publisher.Mono
import kotlin.test.assertEquals
import kotlin.test.assertFails
import kotlin.test.assertTrue

class ModifiedCraftingApiClientTest {
    @Test
    fun `getAllCategories returns mapped categories`() {
        val client = ModifiedCraftingApiClient(createSupport(buildWebClient { handleRequest(it) }))

        val categories = client.getAllCategories(Region.Europe)
        val categoriesById = categories.associateBy { it.id }

        assertTrue(categories.size > 2)
        assertEquals("Global Finishing Reagent 02", categoriesById.getValue(827).name.en_US)
        assertEquals("Global Finishing Reagent 03", categoriesById.getValue(828).name.en_US)
    }

    @Test
    fun `getAllCategories decodes category index when a reference has null name`() {
        val client = ModifiedCraftingApiClient(createSupport(buildWebClient { handleRequest(it) }))

        val categories = client.getAllCategories(Region.Europe)

        assertTrue(categories.isNotEmpty())
        assertTrue(categories.any { it.id == 29 })
        assertEquals("Set Item Level", categories.first { it.id == 29 }.name.en_US)
    }

    @Test
    fun `getAllCategories maps category detail when name is null`() {
        val client =
            ModifiedCraftingApiClient(
                createSupport(
                    buildWebClient { request ->
                        val path = request.url().path
                        if (path.endsWith("/modified-crafting/category/29")) {
                            okJson(
                                """
                                {
                                  "_links": {
                                    "self": {
                                      "href": "https://eu.api.blizzard.com/data/wow/modified-crafting/category/29?namespace=static-eu"
                                    }
                                  },
                                  "id": 29,
                                  "name": null
                                }
                                """.trimIndent(),
                            )
                        } else {
                            handleRequest(request)
                        }
                    },
                ),
            )

        val categories = client.getAllCategories(Region.Europe)
        val category = categories.first { it.id == 29 }

        assertEquals(29, category.id)
        assertEquals("", category.name.en_US)
    }

    @Test
    fun `getAllCategories maps category detail when name is omitted`() {
        val client =
            ModifiedCraftingApiClient(
                createSupport(
                    buildWebClient { request ->
                        val path = request.url().path
                        if (path.endsWith("/modified-crafting/category/502")) {
                            okJson(
                                """
                                {
                                  "_links": {
                                    "self": {
                                      "href": "https://eu.api.blizzard.com/data/wow/modified-crafting/category/502?namespace=static-eu"
                                    }
                                  },
                                  "id": 502
                                }
                                """.trimIndent(),
                            )
                        } else if (path.endsWith("/modified-crafting/category/index")) {
                            okJson(
                                """
                                {
                                  "_links": {
                                    "self": {
                                      "href": "https://eu.api.blizzard.com/data/wow/modified-crafting/category/index?namespace=static-eu"
                                    }
                                  },
                                  "categories": [
                                    {
                                      "id": 502,
                                      "key": {
                                        "href": "https://eu.api.blizzard.com/data/wow/modified-crafting/category/502?namespace=static-eu"
                                      }
                                    }
                                  ]
                                }
                                """.trimIndent(),
                            )
                        } else {
                            handleRequest(request)
                        }
                    },
                ),
            )

        val categories = client.getAllCategories(Region.Europe)
        val category = categories.single()

        assertEquals(502, category.id)
        assertEquals("", category.name.en_US)
    }

    @Test
    fun `getAllSlotTypes returns mapped slot types with compatible categories`() {
        val client = ModifiedCraftingApiClient(createSupport(buildWebClient { handleRequest(it) }))

        val slots = client.getAllSlotTypes(Region.Europe)
        val slotsById = slots.associateBy { it.id }
        val eversingingDust = slotsById.getValue(404)

        assertTrue(slots.size > 2)
        assertEquals(1, eversingingDust.compatibleCategories.size)
        assertEquals(776, eversingingDust.compatibleCategories.first().id)
        assertEquals("Duskshrouded Stone", slotsById.getValue(417).description.en_US)
    }

    @Test
    fun `getAllCategories fails when category detail fetch fails`() {
        val client = ModifiedCraftingApiClient(createSupport(buildWebClient { failingCategoryRequest(it) }))

        val error =
            assertFails {
                client.getAllCategories(Region.Europe)
            }

        assertEquals(true, error.cause is BlizzardApiClientException)
    }

    @Test
    fun `getAllSlotTypes fails when slot detail fetch fails`() {
        val client = ModifiedCraftingApiClient(createSupport(buildWebClient { failingSlotTypeRequest(it) }))

        val error =
            assertFails {
                client.getAllSlotTypes(Region.Europe)
            }

        assertEquals(true, error.cause is BlizzardApiClientException)
    }

    private fun handleRequest(request: ClientRequest): Mono<ClientResponse> {
        val path = request.url().path
        return when {
            path.endsWith("/modified-crafting/index") -> {
                okJson(modifiedCraftingIndexBody())
            }

            path.endsWith("/modified-crafting/category/index") -> {
                okJson(categoryIndexBody())
            }

            path.endsWith("/modified-crafting/reagent-slot-type/index") -> {
                okJson(slotTypeIndexBody())
            }

            path.matches(Regex(".*/modified-crafting/category/\\d+$")) -> {
                okJson(categoryById(path.substringAfterLast('/').toInt()))
            }

            path.matches(Regex(".*/modified-crafting/reagent-slot-type/\\d+$")) -> {
                okJson(slotTypeById(path.substringAfterLast('/').toInt()))
            }

            else -> {
                error("Unexpected request: ${request.method()} ${request.url()}")
            }
        }
    }

    private fun failingCategoryRequest(request: ClientRequest): Mono<ClientResponse> {
        val path = request.url().path
        if (path.endsWith("/modified-crafting/category/828")) {
            return errorResponse()
        }
        return handleRequest(request)
    }

    private fun failingSlotTypeRequest(request: ClientRequest): Mono<ClientResponse> {
        val path = request.url().path
        if (path.endsWith("/modified-crafting/reagent-slot-type/417")) {
            return errorResponse()
        }
        return handleRequest(request)
    }

    private fun errorResponse(): Mono<ClientResponse> =
        Mono.just(
            ClientResponse
                .create(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("boom")
                .build(),
        )

    private fun modifiedCraftingIndexBody(): String =
        loadFixture(this, "/blizzard/modified-crafting/index-response.json")

    private fun categoryIndexBody(): String =
        loadFixture(this, "/blizzard/modified-crafting/category/index-response.json")

    private fun slotTypeIndexBody(): String =
        loadFixture(this, "/blizzard/modified-crafting/reagent-slot-type/index-response.json")

    private fun categoryById(id: Int): String =
        loadFixture(this, "/blizzard/modified-crafting/category/$id-response.json")

    private fun slotTypeById(id: Int): String =
        loadFixture(this, "/blizzard/modified-crafting/reagent-slot-type/$id-response.json")
}
