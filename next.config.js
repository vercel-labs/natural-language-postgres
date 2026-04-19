const { withBotId } = require("botid/next/config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.ctfassets.net"],
  },
};

module.exports = withBotId(nextConfig);
