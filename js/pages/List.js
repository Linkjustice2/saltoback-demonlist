import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="background" :style="backgroundStyle"></div>
            <div class="list-container">
                <table class="list" v-if="list.length">
                    <tr v-for="([level, err], i) in list" :key="i">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected === i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" :src="video" frameborder="0"></iframe>
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
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected + 1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" :key="record.user" class="record">
                            <td class="percent"><p>{{ record.percent }}%</p></td>
                            <td class="user"><a :href="record.link" target="_blank">{{ record.user }}</a></td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>

                <div v-else class="level placeholder">
                    <p>Loading or no level selected...</p>
                </div>
            </div>

            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-if="errors.length">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors && editors.length">
                        <h3>GDPS Staff</h3>
                        <ol class="editors">
                            <li v-for="editor in editors" :key="editor.name">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>Achieved the record without using hacks (FPS bypass allowed, up to 360fps)</p>
                    <p>Recording must show previous attempts and full death animation before completion</p>
                    <p>Insane and Extreme Demons require video proof including clicks</p>
                    <p>Do not use secret routes or easy modes</p>
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
        store,
        roleIconMap,
    }),
    computed: {
        level() {
            return this.list[this.selected]?.[0];
        },
        video() {
            if (!this.level) return "";
            return embed(this.level.verification);
        },
        backgroundStyle() {
            if (!this.level) return {};
            return {
                backgroundImage: `url(${this.getThumbnail()})`,
                filter: "blur(12px) brightness(0.5)",
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                zIndex: "-1",
                backgroundSize: "cover",
                backgroundPosition: "center",
            };
        }
    },
    methods: {
        embed,
        score,
        getThumbnail() {
            if (!this.level) return "";
            const id = this.level.verification.match(/v=([a-zA-Z0-9_-]+)/)?.[1];
            if (!id) return "";
            return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        }
    },
    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();

        if (!this.list) this.errors.push("Failed to load list. Retry later.");
        if (!this.editors) this.errors.push("Failed to load list editors.");

        this.loading = false;
    }
};
