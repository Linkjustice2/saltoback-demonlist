export default {
    template: `
        <!-- Loading State -->
        <main id="packs-page" v-if="loading">
            <p style="text-align: center; margin-top: 3rem;">Loading packs...</p>
        </main>

        <!-- Main Content -->
        <main id="packs-page" v-else>
            
            <!-- Search Bar -->
            <div class="search-wrapper">
                <input
                    type="text"
                    v-model="searchQuery"
                    placeholder="Search packs..."
                    class="search-bar"
                />
            </div>

            <!-- Layout -->
            <div class="packs-layout">

                <!-- Packs List -->
                <div class="packs-grid">
                    <div
                        v-for="(pack, i) in filteredPacks"
                        :key="pack.id"
                        class="pack-card"
                        :class="{ active: selected === i }"
                        @click="selected = i"
                    >
                        <h2>{{ pack.name }}</h2>
                        <p>{{ pack.description }}</p>
                        <span class="levels-count">
                            {{ pack.levels.length }} Levels
                        </span>
                    </div>
                </div>

                <!-- Pack Details -->
                <div class="pack-details">
                    <template v-if="pack">
                        <h1>{{ pack.name }}</h1>
                        <p>{{ pack.description }}</p>

                        <h2>Levels</h2>
                        <ul>
                            <li
                                v-for="level in pack.levels"
                                :key="level"
                            >
                                {{ level }}
                            </li>
                        </ul>
                    </template>

                    <template v-else>
                        <p class="empty-message">
                            Select a pack to see details (ノಠ益ಠ)ノ彡┻━┻
                        </p>
                    </template>
                </div>

            </div>
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
