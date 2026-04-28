"use strict";
require("dotenv/config");
const config_1 = require("prisma/config");
module.exports = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: (0, config_1.env)("DATABASE_URL"),
    },
});
//# sourceMappingURL=prisma.config.js.map
