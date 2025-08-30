/* Main leaderboard container */
.page-leaderboard-container {
    display: block;
}

/* Page list */
.page-list {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
}

/* Blurred background using pseudo-element */
.page-list::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: inherit; /* uses the inline background-image from Vue */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(12px);
    z-index: 0;
}

/* Make sure all content stays above the blurred background */
.page-list > * {
    position: relative;
    z-index: 1;
}

/* List container */
.list-container {
    width: 100%;
    padding: 1rem;
}

/* Table styling */
.list {
    width: 100%;
    border-collapse: collapse;
}

.list td.rank {
    width: 50px;
    text-align: center;
}

.list td.level button {
    width: 100%;
    border: none;
    background: transparent;
    cursor: pointer;
}

/* Level container */
.level-container {
    width: 100%;
    padding: 1rem;
    display: flex;
    flex-direction: column;
}

/* Level details */
.level {
    display: flex;
    flex-direction: column;
}

.level h1 {
    margin-bottom: 0.5rem;
}

.video {
    width: 100%;
    height: 400px;
    margin-bottom: 1rem;
}

/* Stats list */
.stats {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
    display: flex;
    gap: 2rem;
}

.stats li {
    display: flex;
    flex-direction: column;
}

/* Records table */
.records {
    width: 100%;
    border-collapse: collapse;
}

.records td {
    padding: 0.5rem;
}

.records td.percent {
    width: 60px;
    text-align: center;
}

/* Meta container */
.meta-container {
    padding: 1rem;
}

.meta {
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 8px;
}

/* Errors */
.errors .error {
    color: red;
    margin-bottom: 0.5rem;
}

/* Editors list */
.editors {
    list-style: none;
    padding: 0;
}

.editors li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Links */
a {
    color: inherit;
    text-decoration: underline;
}

a.link:hover {
    text-decoration: none;
}
