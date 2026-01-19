export declare class NFTAttribute {
    trait_type: string;
    value: string | number;
    display_type?: string;
}
export declare class NFTMetadataDto {
    name: string;
    description: string;
    image: string;
    external_url?: string;
    background_color?: string;
    animation_url?: string;
    attributes: NFTAttribute[];
}
