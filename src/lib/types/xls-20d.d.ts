export interface Xls20D {
  schema: "ipfs://QmNpi8rcXEkohca8iXu7zysKKSJYqCvBJn3xJwga8jXqWU";
  nftType: "art.v0";
  name: string;
  description: string;
  image: string;
  animation?: string;
  video?: string;
  audio?: string;
  file?: string;
  collection?: {
    name: string;
    family?: string;
    [k: string]: unknown;
  };
  attributes?: {
    trait_type: string;
    value: string | number;
    description?: string;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
