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
        <div class="background" :style="backgroundStyle"></div>
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list.length">
                    <tr v-for="([level, err], i) in list">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
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
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
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
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> or better to qualify</p>
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

                <div v-else class="level empty-level">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors.length">
                        <h3>GDPS Staff</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        Achieved the record without using hacks (FPS bypass allowed up to 360fps)
                    </p>
                    <p>
                        Must be on the level listed on the site - check the ID before submitting
                    </p>
                    <p>
                        Insane and Extreme Demons require video proof
                    </p>
                    <p>
                        Show previous attempt and death animation before completion, unless first attempt
                    </p>
                    <p>
                        Must show hitting the endwall, or completion is invalid
                    </p>
                    <p>
                        No secret or bug routes
                    </p>
                    <p>
                        Easy modes not allowed
                    </p>
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
        mouseX: 0,
        mouseY: 0,
    }),
    computed: {
        level() {
            return this.list[this.selected]?.[0];
        },
        video() {
            if (!this.level) return "";
            return this.level.showcase ? embed(this.level.showcase) : embed(this.level.verification);
        },
        backgroundStyle() {
            if (!this.level) return {};
            let thumb = "";
            try {
                if (this.level.thumbnail) {
                    thumb = this.level.thumbnail;
                } else if (typeof this.level.verification === "string" && this.level.verification.includes("youtube")) {
                    const urlParams = new URLSearchParams(this.level.verification.split("?")[1]);
                    const v = urlParams.get("v");
                    thumb = `https://img.youtube.com/vi/${v}/hqdefault.jpg`;
                }
            } catch {
                thumb = "";
            }
            const moveX = (this.mouseX - window.innerWidth / 2) / 50;
            const moveY = (this.mouseY - window.innerHeight / 2) / 50;

            return {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundImage: thumb ? `url(${thumb})` : "none",
                backgroundSize: "cover",
                backgroundPosition: `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`,
                filter: "blur(20px) brightness(0.45)",
                zIndex: -1,
                transition: "background-position 0.1s",
            };
        },
    },
    async mounted() {
        window.addEventListener("mousemove", e => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        try {
            const fetchedList = await fetchList();
            if (fetchedList) this.list = fetchedList;
            const fetchedEditors = await fetchEditors();
            if (fetchedEditors) this.editors = fetchedEditors;

            if (!fetchedList) {
                this.errors.push("Failed to load list. Retry later.");
            } else {
                this.errors.push(
                    ...fetchedList.filter(([_, err]) => err).map(([_, err]) => `Failed to load level. (${err}.json)`)
                );
                if (!fetchedEditors) {
                    this.errors.push("Failed to load editors.");
                }
            }
        } catch (e) {
            console.error(e);
            this.errors.push("Error loading list or editors.");
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
    },
};
