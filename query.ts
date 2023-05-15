import * as GraphClient from "./.graphclient";
import { execute } from "./.graphclient";
import multihash from "multihashes";
import bs58 from "bs58";

type BadgerSubgraph = Pick<
  GraphClient.Subgraph,
  "id" | "displayName" | "versions"
>;

type SubgraphEntry = {
  subgraphId: string;
  displayName: string;
  versionLabel: string;
  versionCreatedAt: string;
  subgraphDeploymentId: string;
  subgraphDeploymentIdHex: string;
};

async function getBadgerSubgraphs(document: any): Promise<SubgraphEntry[]> {
  const subgraphList: SubgraphEntry[] = [];

  const result = await execute(document, {}, {});
  result.data.subgraphs.map((s: BadgerSubgraph) => {
    for (const version of s.versions) {
      subgraphList.push({
        subgraphId: s.id,
        displayName: s.displayName ?? "",
        versionLabel: version.label ?? "",
        versionCreatedAt: new Date(version.createdAt * 1000).toDateString(),
        subgraphDeploymentId: hexToCIDv0(version.subgraphDeployment.id), 
        subgraphDeploymentIdHex: version.subgraphDeployment.id,
      });
    }
  });

  return subgraphList;
}

function hexToCIDv0(input: string) {
  if (input.startsWith("0x")) {
    input = input.slice(2);
  }

  const split = (input.match(/.{1,2}/g) ?? []).map((byte) =>
    parseInt(byte, 16)
  );
  const byteArray = new Uint8Array(split);
  const hash = multihash.encode(byteArray, "sha2-256");
  const base58 = bs58.encode(hash);
  return base58;
}

async function main() {
  const result = [
    ...(await getBadgerSubgraphs(GraphClient.BadgerVaultsDocument)),
    ...(await getBadgerSubgraphs(GraphClient.BadgerTokensDocument)),
  ];
  console.table(result);
}

main();
