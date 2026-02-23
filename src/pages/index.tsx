import { useRouter } from "next/router";
import { useEffect } from "react";

function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/patients");
  }, [router]);

  return null;
}

export default Home;
