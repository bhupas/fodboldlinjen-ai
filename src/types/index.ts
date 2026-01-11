export type Match = {
    id: string;
    date: string;
    opponent: string;
    team?: string;
    created_at: string;
};

export type PlayerStats = {
    id: string;
    match_id: string;
    player_name: string;
    successful_passes: number;
    total_passes: number;
    total_shots: number;
    tackles_own_half: number;
    tackles_opp_half: number;
    total_tackles: number;
    goals?: number;
    assists?: number;
    minutes_played?: number;
    yellow_cards?: number;
    red_cards?: number;
    distance_km?: number;
    feedback?: string;
    created_at: string;
};

export interface UploadedRow {
    Timestamp?: string;
    'Kamp - Hvilket hold spillede du for'?: string;
    'Modstanderen (Hvem spillede du mod)'?: string;
    'Navn (Fulde Navn)'?: string;
    '#Succesfulde pasninger /indlæg'?: number | string;
    '#Total pasninger/indlæg (succesfulde + ikke succesfulde)'?: number | string;
    '#Total afslutninger'?: number | string;
    '#Succesfulde erobringer på EGEN bane'?: number | string;
    '#Succesfulde erobringer på DERES bane'?: number | string;
    '#Total Succesfulde Erobringer (Egen + Deres bane)'?: number | string;
    'Mål'?: number | string;
    'Assist'?: number | string;
    'Spilleminutter'?: number | string;
    'Gule kort'?: number | string;
    'Røde kort'?: number | string;
    'Hvad vil du gøre bedre i næste kamp ?'?: string;
}
