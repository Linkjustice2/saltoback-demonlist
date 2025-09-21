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
            <div class="tabs" v-if="tabs.length">
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
                        v-for="(pack, i) in filteredPacks"
                        :key="pack.id || i"
                        class="pack-card"
                        :class="{ active: selected === i }"
                        @click="selected = i"
                    >
                        <h2>{{ pack.name }}</h2>
                        <p>{{ pack.description || 'No description' }}</p>
                        <p class="levels-count">{{ pack.levels?.length || 0 }} levels</p>
                    </div>
                </div>

                <!-- Pack Details Panel -->
                <div class="pack-details" v-if="pack">
                    <h1>{{ pack.name }}</h1>
                    <p>{{ pack.description || 'No description available.' }}</p>
                    <h2>Levels</h2>
                    <ul>
                        <li v-for="level in pack.levels || []" :key="level">{{ level }}</li>
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
        tabs: ["All"], // safe default
    }),
    computed: {
        pack() {
            return this.packs[this.selected] || null;
        },
        filteredPacks() {
            let filtered = this.packs;

            if (this.currentTab && this.currentTab !== "All") {
                filtered = filtered.filter(p => p.category && p.category === this.currentTab);
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
            const data = await res.json();
            this.packs = Array.isArray(data) ? data : [];

            // Create tabs dynamically based on categories, if present
            const categories = Array.from(new Set(this.packs.map(p => p.category).filter(Boolean))).sort();
            if (categories.length) this.tabs = ["All", ...categories];

        } catch (err) {
            console.error("Failed to load packs.json", err);
        }

        this.loading = false;
    }
};
