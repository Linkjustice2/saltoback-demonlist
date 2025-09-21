export default {
    template: `
        <main v-if="loading" class="page-list">
            <p>Loading packs...</p>
        </main>

        <main v-else class="page-list">
            <!-- Search bar -->
            <input
                type="text"
                v-model="searchQuery"
                placeholder="Search packs..."
                class="search-bar"
            />

            <!-- Packs grid -->
            <div class="packs-layout">
                <div class="packs-grid">
                    <div
                        v-for="(pack, i) in filteredPacks"
                        :key="pack.id"
                        class="pack-card"
                        :class="{ active: selected === i }"
                        @click="selected = i"
                    >
                        <h3>{{ pack.name }}</h3>
                        <p class="levels-count">{{ pack.levels.length }} levels</p>
                    </div>
                </div>

                <!-- Pack details panel -->
                <div class="pack-details" v-if="pack">
                    <h1>{{ pack.name }}</h1>
                    <p>{{ pack.description }}</p>
                    <h2>Levels</h2>
                    <ul>
                        <li v-for="level in pack.levels" :key="level">
                            {{ level }}
                        </li>
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
        searchQuery: ""
    }),
    computed: {
        pack() {
            return this.packs[this.selected] || null;
        },
        filteredPacks() {
            if (!this.searchQuery) return this.packs;
            const query = this.searchQuery.toLowerCase();
            return this.packs.filter(p => p.name.toLowerCase().includes(query));
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
