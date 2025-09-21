export default {
    template: `
        <main id="packs-page" v-if="loading">
            <p>Loading packs...</p>
        </main>

        <main id="packs-page" v-else>
            <!-- Search bar -->
            <input
                type="text"
                v-model="searchQuery"
                placeholder="Search packs..."
                class="search-bar"
            />

            <!-- Tabs -->
            <div class="tabs">
                <div
                    class="tab"
                    v-for="tab in tabs"
                    :key="tab"
                    :class="{ active: currentTab === tab }"
                    @click="currentTab = tab"
                >
                    {{ tab }}
                </div>
            </div>

            <div class="packs-layout">
                <!-- Packs Grid -->
                <div class="packs-grid">
                    <div
                        class="pack-card"
                        v-for="(pack, i) in filteredPacks"
                        :key="pack.id"
                        :class="{ active: selected === i }"
                        @click="selected = i"
                    >
                        <h2>{{ pack.name }}</h2>
                        <p>{{ pack.description }}</p>
                        <p class="levels-count">{{ pack.levels.length }} levels</p>
                    </div>
                </div>

                <!-- Pack Details Panel -->
                <div class="pack-details" v-if="pack">
                    <h1>{{ pack.name }}</h1>
                    <p>{{ pack.description }}</p>
                    <h2>Levels</h2>
                    <ul>
                        <li v-for="level in pack.levels" :key="level">{{ level }}</li>
                    </ul>
                </div>

                <div class="pack-details empty" v-else>
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        packs: [],
        loading: true,
        selected: 0,
        searchQuery: "",
        currentTab: "All",
        tabs: ["All"], // default, will populate dynamically
    }),
    computed: {
        pack() {
            return this.packs[this.selected] || null;
        },
        filteredPacks() {
            let filtered = this.packs;
            if (this.currentTab !== "All") {
                filtered = filtered.filter(p => p.category === this.currentTab);
            }
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
            }
            return filtered;
        }
    },
    async mounted() {
        try {
            const res = await fetch("data/packs.json");
            this.packs = await res.json();

            // Populate tabs dynamically based on categories
            const categories = Array.from(new Set(this.packs.map(p => p.category))).sort();
            this.tabs = ["All", ...categories];
        } catch (err) {
            console.error("Failed to load packs.json", err);
        }
        this.loading = false;
    }
};
