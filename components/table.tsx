import { sql } from "@vercel/postgres";
import RefreshButton from "./refresh-button";
import { Unicorn } from "@/lib/types";
import Chat from "./input";

export default async function Table() {
  let data;
  let startTime = Date.now();


  return (
    <div>
      <Chat />
    </div>
  );
}
