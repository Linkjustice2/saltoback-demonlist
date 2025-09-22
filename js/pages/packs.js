export default {
    template: `
        <main id="packs-page" v-if="loading">
            <p style="text-align: center; margin-top: 3rem;">Loading packs...</p>
        </main>

        <main id="packs-page" v-else>
            <!-- Search -->
            <div class="search-container">
                <input
                    type="text"
                    v-model="searchQuery"
                    placeholder="Search packs..."
                    class="search-bar"
                />
            </div>

            <div class="packs-layout">
                <!-- Column 1: Packs List -->
                <section class="packs-list">
                    <div
                        v-for="(pack, i) in filteredPacks"
                        :key="pack.id"
                        class="pack-card"
                        :class="{ 'active': selected === i }"
                        @click="selected = i"
                    >
                        <h2>{{ pack.name }}</h2>
                        <p>{{ pack.description }}</p>
                        <span class="levels-count">{{ pack.levels.length }} Levels</span>
                    </div>
                </section>

                <!-- Column 2: Selected Pack Details -->
                <section class="pack-details" v-if="pack">
                    <h1>{{ pack.name }}</h1>
                    <p class="desc">{{ pack.description }}</p>

                    <h2>Levels</h2>
                    <ul>
                        <li v-for="level in pack.levels" :key="level">{{ level }}</li>
                    </ul>
                </section>

                <section class="pack-details empty" v-else>
                    <p>Select a pack to see details (ノಠ益ಠ)ノ彡┻━┻</p>
                </section>

                <!-- Column 3: Reserved -->
                <section class="meta-panel">
                    <h2>Coming Soon</h2>
                    <p>You can decide what goes here.</p>
                </section>
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
