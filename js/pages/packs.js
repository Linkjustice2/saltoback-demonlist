export default {
    template: `
        <main id="packs-page" v-if="loading" class="page-list">
            <p>Loading packs...</p>
        </main>

        <main id="packs-page" v-else class="page-list">
            <div class="list-container">
                <!-- Search bar -->
                <input
                    type="text"
                    v-model="searchQuery"
                    placeholder="Search packs..."
                    class="search-bar"
                />

                <!-- Packs list -->
                <table class="list" v-if="filteredPacks.length">
                    <tr v-for="(pack, i) in filteredPacks" :key="pack.id">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ 'active': selected === i }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ pack.name }}</span>
                            </button>
                        </td>
                    </tr>
                </table>

                <p v-else>No packs found.</p>
            </div>

            <!-- Pack Details -->
            <div class="level-container">
                <div v-if="pack" class="level">
                    <h1>{{ pack.name }}</h1>
                    <p>{{ pack.description }}</p>

                    <h2>Levels</h2>
                    <ul>
                        <li v-for="level in pack.levels" :key="level">
                            {{ level }}
                        </li>
                    </ul>
                </div>

                <div v-else class="level" style="height: 100%; display: flex; justify-content: center; align-items: center;">
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
