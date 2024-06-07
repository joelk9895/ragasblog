/** @type {import('next').NextConfig} */
import { withContentlayer } from "next-contentlayer";
const nextConfig = {
  images: {
    domains: ["avatar.iran.liara.run", "s3-us-west-2.amazonaws.com"],
  },
};

export default withContentlayer(nextConfig);
