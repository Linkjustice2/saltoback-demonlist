import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown-dark",
    admin: "user-gear-dark",
    helper: "user-shield-dark",
    dev: "code-dark",
    trial: "user-lock-dark",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading" class="page-list">
            <Spinner />
        </main>

        <main v-else class="page-list">

            <!-- List Table -->
            <div class="list-container">

                <!-- Modern Dark Search Bar -->
                <input
                    type="text"
                    v-model="searchQuery"
                    placeholder="Search levels..."
                    class="search-bar"
                />

                <table class="list" v-if="filteredList.length">
                    <tr v-for="({ item: [level, err], idx }, i) in filteredList" :key="idx">
                        <td class="rank">
                            <p v-if="idx + 1 <= 150" class="type-label-lg">#{{ idx + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == idx, 'error': !level }">
                            <button @click="selected = idx">
                                <span class="type-label-lg">
                                    {{ level?.name || \`Error (\${err}.json)\` }}
                                </span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Level Details -->
            <div class="level-container">
                <div v-if="level" class="level">

                    <h1>{{ level.name }}</h1>
                    <LevelAuthors
                        :author="level.author"
                        :creators="level.creators"
                        :verifier="level.verifier"
                    />

                    <iframe
                        class="video"
                        id="videoframe"
                        :src="video"
                        frameborder="0"
                    ></iframe>

                    <!-- Stats -->
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                    </ul>

                    <!-- Records -->
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected + 1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>

                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- No level selected -->
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <!-- Meta Info -->
            <div class="meta-container">
                <div class="meta">

                    <!-- Errors -->
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>

                    <!-- Original Credit -->
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>

                    <!-- Editors -->
                    <template v-if="editors">
                        <h3>GDPS Staff</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>

                    <!-- Submission Requirements -->
                    <h3>SUBMISSION REQUIREMENTS</h3>
                    <p>Achieved the record without using hacks (FPS bypass allowed up to 360fps).</p>
                    <p>Must be on the listed level; check the level ID before submitting.</p>
                    <p>Insane/Extreme Demons require full video proof.</p>
                    <p>Show full death animation unless first attempt completion.</p>
                    <p>Player must hit endwall; secret/bug routes not allowed.</p>
                    <p>Do not use easy modes; only unmodified completion counts.</p>

                </div>
            </div>

        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        searchQuery: "", // reactive search
    }),
    computed: {
        level() {
            return this.list[this.selected]?.[0];
        },
        filteredList() {
            if (!this.searchQuery) return this.list.map((item, idx) => ({ item, idx }));
            const query = this.searchQuery.toLowerCase();
            return this.list
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) => item[0]?.name.toLowerCase().includes(query));
        },
        video() {
            if (!this.level) return '';
            if (!this.level.showcase) return embed(this.level.verification);
            return embed(this.level.showcase || this.level.verification);
        },
        currentLevelBackground() {
            return {};
        }
    },
    methods: {
        embed,
        score,
        getThumbnail(level) {
            if (!level?.verification) return '';
            const id = level.verification.split('v=')[1]?.split('&')[0] || '';
            return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        }
    },
    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();

        if (!this.list) {
            this.errors = ["Failed to load list. Retry in a few minutes or notify list staff."];
        } else {
            this.errors.push(
                ...this.list.filter(([_, err]) => err).map(([_, err]) => `Failed to load level. (${err}.json)` )
            );
            if (!this.editors) this.errors.push("Failed to load list editors.");
        }

        this.loading = false;
    }
};
