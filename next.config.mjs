/** @type {import('next').NextConfig} */

const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  images: {
    domains: [
      "avatar.iran.liara.run",
      "s3-us-west-2.amazonaws.com",
      "prod-files-secure.s3.us-west-2.amazonaws.com",
      "firebasestorage.googleapis.com",
      "cdn.hashnode.com",
    ],
  },
};

export default nextConfig;
