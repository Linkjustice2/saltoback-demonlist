export default {
    template: `
        <!-- LOADING STATE -->
        <main id="packs-page" v-if="loading" class="loading-state">
            <p>Loading packs...</p>
        </main>

        <!-- MAIN PAGE -->
        <main id="packs-page" v-else class="packs-page">

            <!-- LEFT: Pack Details -->
            <aside class="pack-details">
                <template v-if="pack">
                    <header class="pack-header">
                        <h1 class="pack-title">{{ pack.name }}</h1>
                        <p class="pack-description">{{ pack.description }}</p>
                    </header>

                    <section class="levels-section">
                        <h2 class="section-title">Levels ({{ pack.levels.length }})</h2>
                        <ul class="levels-list">
                            <li
                                v-for="level in pack.levels"
                                :key="level"
                                class="level-item"
                            >
                                {{ level }}
                            </li>
                        </ul>
                    </section>
                </template>

                <template v-else>
                    <div class="empty-state">
                        <p>Select a pack to view details (ノಠ益ಠ)ノ彡┻━┻</p>
                    </div>
                </template>
            </aside>

            <!-- RIGHT: Packs Browser -->
            <section class="packs-browser">
                <div class="search-bar-container">
                    <input
                        type="text"
                        v-model="searchQuery"
                        placeholder="Search packs..."
                        class="search-bar"
                    />
                </div>

                <div class="packs-grid">
                    <div
                        v-for="(pack, i) in filteredPacks"
                        :key="pack.id"
                        class="pack-card"
                        :class="{ active: selected === i }"
                        @click="selected = i"
                    >
                        <header class="pack-card-header">
                            <h2 class="pack-card-title">{{ pack.name }}</h2>
                            <span class="levels-count">
                                {{ pack.levels.length }} Levels
                            </span>
                        </header>
                        <p class="pack-card-description">
                            {{ pack.description }}
                        </p>
                    </div>
                </div>
            </section>

        </main>
    `,
    data: () => ({
        packs: [],
        loading: true,
        selected: null,
        searchQuery: ""
    }),
    computed: {
        pack() {
            return this.packs[this.selected] || null;
        },
        filteredPacks() {
            if (!this.searchQuery) return this.packs;
            const query = this.searchQuery.toLowerCase();
            return this.packs.filter(p =>
                p.name.toLowerCase().includes(query)
            );
        }
    },
    async mounted() {
        try {
            const res = await fetch("data/packs.json");
            this.packs = await res.json();
        } catch (err) {
            console.error("Failed to load packs.json", err);
        }
        this.loading = false;
    }
};
