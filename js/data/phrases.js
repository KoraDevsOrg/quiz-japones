/**
 * Catálogo de Chunks y Frases Situacionales
 * Incluye entonación y patrones gramaticales
 */
export const PHRASES_DATA = Object.freeze([
  {
    id: "ph_01",
    situation: "Restaurante / Tienda",
    jp: "これをください",
    kana: "これをください",
    romaji: "kore o kudasai",
    meaning: "Deme esto, por favor",
    pattern: "[Objeto] + をください",
    pitch: "koRE(↑) o kudaSA(↓)i"
  },
  {
    id: "ph_02",
    situation: "Restaurante / Pago",
    jp: "お会計をお願いします",
    kana: "おかいけいをおねがいします",
    romaji: "okaikei o onegaishimasu",
    meaning: "La cuenta, por favor",
    pattern: "お会計 + をお願いします",
    pitch: "okaIKEI(↑) o onegai shiMAsu(↓)"
  },
  {
    id: "ph_03",
    situation: "Restaurante / Petición",
    jp: "お水をお願いします",
    kana: "おみずをおねがいします",
    romaji: "omizu o onegaishimasu",
    meaning: "Agua, por favor",
    pattern: "[Cosa] + をお願いします",
    pitch: "omiZU(↑) o onegai shiMAsu(↓)"
  },
  {
    id: "ph_04",
    situation: "Ubicación / Calle",
    jp: "トイレはどこですか",
    kana: "といれはどこですか",
    romaji: "toire wa doko desu ka",
    meaning: "¿Dónde está el baño?",
    pattern: "[Lugar] + はどこですか",
    pitch: "TO(↑)ire wa DOKO(↑) desu ka"
  },
  {
    id: "ph_05",
    situation: "Ubicación / Transporte",
    jp: "駅はどこですか",
    kana: "えきはどこですか",
    romaji: "eki wa doko desu ka",
    meaning: "¿Dónde está la estación?",
    pattern: "[Lugar] + はどこですか",
    pitch: "E(↑)ki wa DOKO(↑) desu ka"
  },
  {
    id: "ph_06",
    situation: "Permiso / Cortesía",
    jp: "写真を撮ってもいいですか",
    kana: "しゃしんをとってもいいですか",
    romaji: "shashin o totte mo ii desu ka",
    meaning: "¿Puedo tomar una foto?",
    pattern: "[Verbo Te] + もいいですか",
    pitch: "shaSHIN(↑) o totte mo II(↑) desu ka"
  },
  {
    id: "ph_07",
    situation: "Comprensión / Auxilio",
    jp: "もう一度お願いします",
    kana: "もういちどおねがいします",
    romaji: "mou ichido onegaishimasu",
    meaning: "Una vez más, por favor",
    pattern: "もう一度 + お願いします",
    pitch: "mou ichiDO(↑) onegai shiMAsu(↓)"
  },
  {
    id: "ph_08",
    situation: "Conversación básica",
    jp: "日本語が少し分かります",
    kana: "にほんごがすこしわかります",
    romaji: "nihongo ga sukoshi wakarimasu",
    meaning: "Entiendo un poco de japonés",
    pattern: "[Idioma] + が少し分かります",
    pitch: "nihonGO(↑) ga suKOshi(↑) wakaRImasu(↓)"
  },
  {
    id: "ph_09",
    situation: "Compras / Precio",
    jp: "これはいくらですか",
    kana: "これはいくらですか",
    romaji: "kore wa ikura desu ka",
    meaning: "¿Cuánto cuesta esto?",
    pattern: "これ + はいくらですか",
    pitch: "koRE(↑) wa I(↑)kura desu ka"
  },
  {
    id: "ph_10",
    situation: "Cortesía diaria",
    jp: "手伝ってもらえますか",
    kana: "てつだってもらえますか",
    romaji: "tetsudatte moraemasu ka",
    meaning: "¿Me puedes ayudar?",
    pattern: "[Verbo Te] + もらえますか",
    pitch: "tetsuDAtte(↑) moraeMAsu(↓) ka"
  }
]);
