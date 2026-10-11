import { useRouter } from "next/router";
import { useEffect } from "react";
import { paths } from "@/utils/paths";

function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push(paths.patient());
  }, [router]);

  return null;
}

export default Home;
