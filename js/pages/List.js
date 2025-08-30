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
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list" :key="i">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">
                                    {{ level?.name || \`Unable to load (\${err}.json)\` }}
                                </span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Level Details -->
            <div class="level-container">
                <div v-if="level" class="level">

                    <h1 class="type-title-xl">{{ level.name }}</h1>
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
                        allowfullscreen
                    ></iframe>

                    <!-- Stats -->
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points on Completion</div>
                            <p class="type-label-md">
                                {{ score(selected + 1, 100, level.percentToQualify) }}
                            </p>
                        </li>
                        <li>
                            <div class="type-title-sm">Level ID</div>
                            <p class="type-label-md">{{ level.id }}</p>
                        </li>
                    </ul>

                    <!-- Records -->
                    <h2 class="type-title-lg">Records</h2>
                    <p v-if="selected + 1 <= 75">
                        Achieve <strong>{{ level.percentToQualify }}%</strong> or higher to qualify
                    </p>
                    <p v-else-if="selected + 1 <= 150">
                        Achieve <strong>100%</strong> or higher to qualify
                    </p>
                    <p v-else>
                        This level does not accept new records.
                    </p>

                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p class="type-label-md">{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a
                                    :href="record.link"
                                    target="_blank"
                                    class="type-label-lg"
                                >
                                    {{ record.user }}
                                </a>
                            </td>
                            <td class="mobile">
                                <img
                                    v-if="record.mobile"
                                    :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`"
                                    alt="Mobile device"
                                >
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- No level selected -->
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p class="type-label-lg">No level selected 😢</p>
                </div>
            </div>

            <!-- Meta Info -->
            <div class="meta-container">
                <div class="meta">

                    <!-- Errors -->
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">⚠️ {{ error }}</p>
                    </div>

                    <!-- Original Credit -->
                    <div class="og">
                        <p class="type-label-md">
                            Website layout designed by
                            <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>
                        </p>
                    </div>

                    <!-- Editors -->
                    <template v-if="editors">
                        <h3 class="type-title-md">GDPS Staff</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img
                                    :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`"
                                    :alt="editor.role"
                                >
                                <a
                                    v-if="editor.link"
                                    class="type-label-lg link"
                                    target="_blank"
                                    :href="editor.link"
                                >
                                    {{ editor.name }}
                                </a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>

                    <!-- Submission Requirements -->
                    <h3 class="type-title-md">Submission Guidelines</h3>
                    <ul class="submission-reqs">
                        <li>Records must be achieved without hacks (FPS bypass up to 360fps allowed).</li>
                        <li>Ensure you are playing the correct level; verify the level ID before submission.</li>
                        <li>Insane/Extreme Demons require full video proof.</li>
                        <li>Show the full death animation unless it’s a first-attempt completion.</li>
                        <li>Endwall must be hit; secret or bug routes are not allowed.</li>
                        <li>No easy modes; only unmodified completions count.</li>
                    </ul>

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
        store
    }),
    computed: {
        level() {
            return this.list[this.selected]?.[0];
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
            this.errors = ["Failed to load list. Please retry or contact GDPS staff."];
        } else {
            this.errors.push(
                ...this.list.filter(([_, err]) => err).map(([_, err]) => `Unable to load level (${err}.json)`)
            );
            if (!this.editors) this.errors.push("Failed to load list editors.");
        }

        this.loading = false;
    }
};
