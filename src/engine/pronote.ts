// v142 Hướng dẫn phát âm từng câu (người sáng lập 16/10/2026): bài Nói (Nói nhại) và bài Đọc (Đọc to) hiện mỗi câu kèm phiên âm IPA
// từng từ, trọng âm, nối âm, từ đọc nhẹ, âm cuối dễ nuốt, lên / xuống giọng và mẹo cho người Việt. Thuần hàm; app.js truyền vào hàm tra
// IPA của danh sách từ (5150 từ A1–C2). Phiên âm ghép tự động (bảng + luật đuôi), chưa người thật kiểm. Chỉ để luyện, không ghi bằng chứng.

export type EndKind = 's' | 'ed' | 'cons';
export interface PnTok {
  r: string;                 // chữ như trong câu (giữ dấu câu)
  w: string;                 // chữ thường, bỏ dấu câu
  ipa: string;               // không có dấu / /; '' nếu là tên riêng / số / chưa có
  kind: 'word' | 'name' | 'num' | 'unk';
  content: boolean;          // từ mang nghĩa (nhấn trong câu); từ chức năng thì không
  weak?: string;             // từ chức năng đọc nhẹ ở câu này: IPA dạng nhẹ (ipa vẫn là dạng nhẹ, strong là dạng mạnh)
  strong?: string;
  end?: { k: EndKind; ipa: string };   // âm cuối dễ nuốt
  link?: '' | 'r';           // nối sang từ sau ('' = phụ âm cuối + nguyên âm đầu; 'r' = nối bằng /r/)
}
export interface PnTip { id: string; t: string; snd: string | null }
export interface PnNote { toks: PnTok[]; tune: '↗' | '↘'; tips: PnTip[] }
export type IpaOf = (w: string) => string | undefined;

// ---------- Bảng ----------
// Từ chức năng: [mạnh, nhẹ]; nhẹ = '' khi không có dạng nhẹ riêng.
const FN: Record<string, [string, string]> = {
  a: ['eɪ', 'ə'], an: ['æn', 'ən'], the: ['ðiː', 'ðə'], and: ['ænd', 'ən'], to: ['tuː', 'tə'], for: ['fɔː', 'fə'], of: ['ɒv', 'əv'],
  at: ['æt', 'ət'], from: ['frɒm', 'frəm'], can: ['kæn', 'kən'], was: ['wɒz', 'wəz'], were: ['wɜː', 'wə'], are: ['ɑː', 'ə'],
  am: ['æm', 'əm'], has: ['hæz', 'həz'], have: ['hæv', 'həv'], had: ['hæd', 'həd'], do: ['duː', 'də'], does: ['dʌz', 'dəz'],
  them: ['ðem', 'ðəm'], than: ['ðæn', 'ðən'], as: ['æz', 'əz'], but: ['bʌt', 'bət'], some: ['sʌm', 'səm'], there: ['ðeə', 'ðə'],
  her: ['hɜː', 'hə'], him: ['hɪm', 'ɪm'], his: ['hɪz', 'ɪz'], us: ['ʌs', 'əs'], your: ['jɔː', 'jə'], would: ['wʊd', 'wəd'],
  could: ['kʊd', 'kəd'], should: ['ʃʊd', 'ʃəd'], must: ['mʌst', 'məst'], or: ['ɔː', 'ə'], that: ['ðæt', ''], you: ['juː', ''],
  is: ['ɪz', ''], i: ['aɪ', ''], me: ['miː', ''], my: ['maɪ', ''], he: ['hiː', ''], she: ['ʃiː', ''], we: ['wiː', ''], they: ['ðeɪ', ''],
  it: ['ɪt', ''], its: ['ɪts', ''], our: ['ˈaʊə', ''], their: ['ðeə', ''], this: ['ðɪs', ''], these: ['ðiːz', ''], those: ['ðəʊz', ''],
  in: ['ɪn', ''], on: ['ɒn', ''], by: ['baɪ', ''], with: ['wɪð', ''], into: ['ˈɪntuː', ''], about: ['əˈbaʊt', ''], be: ['biː', ''],
  been: ['biːn', ''], did: ['dɪd', ''], will: ['wɪl', ''], so: ['səʊ', ''], if: ['ɪf', ''], not: ['nɒt', ''], no: ['nəʊ', ''],
  up: ['ʌp', ''], out: ['aʊt', ''], off: ['ɒf', ''], all: ['ɔːl', ''], any: ['ˈeni', ''], too: ['tuː', ''], then: ['ðen', ''],
  what: ['wɒt', ''], where: ['weə', ''], when: ['wen', ''], who: ['huː', ''], why: ['waɪ', ''], how: ['haʊ', ''], which: ['wɪtʃ', ''],
  whose: ['huːz', ''], here: ['hɪə', ''], very: ['ˈveri', ''], also: ['ˈɔːlsəʊ', ''], just: ['dʒʌst', ''], one: ['wʌn', ''],
  yes: ['jes', ''], hmm: ['həm', ''], um: ['ʌm', ''], uh: ['ʌ', ''], ah: ['ɑː', ''], wow: ['waʊ', ''], oops: ['ʊps', ''], yeah: ['jeə', ''], ok: ['ˌəʊˈkeɪ', ''], okay: ['ˌəʊˈkeɪ', ''], hello: ['həˈləʊ', ''], hi: ['haɪ', ''], please: ['pliːz', ''],
  mr: ['ˈmɪstə', ''], mrs: ['ˈmɪsɪz', ''], ms: ['mɪz', ''], till: ['tɪl', ''], until: ['ənˈtɪl', ''], because: ['bɪˈkɒz', ''],
};
// Từ chức năng nhưng nói "Yes/No, thanks" vẫn là từ nhấn: những từ sau coi là từ mang nghĩa.
const FN_CONTENT = new Set(['hmm', 'um', 'uh', 'ah', 'wow', 'oops', 'yeah', 'yes', 'no', 'not', 'ok', 'okay', 'hello', 'hi', 'please', 'what', 'where', 'when', 'who', 'why', 'how', 'which', 'whose', 'here', 'very', 'also', 'too', 'all', 'any', 'one', 'out', 'up', 'off', 'this', 'these', 'those', 'just']);
const CONTR: Record<string, string> = {
  "i'm": 'aɪm', "you're": 'jɔː', "he's": 'hiːz', "she's": 'ʃiːz', "it's": 'ɪts', "we're": 'wɪə', "they're": 'ðeə', "i've": 'aɪv',
  "you've": 'juːv', "we've": 'wiːv', "they've": 'ðeɪv', "i'll": 'aɪl', "you'll": 'juːl', "he'll": 'hiːl', "she'll": 'ʃiːl', "we'll": 'wiːl',
  "they'll": 'ðeɪl', "it'll": 'ˈɪtl', "i'd": 'aɪd', "you'd": 'juːd', "he'd": 'hiːd', "she'd": 'ʃiːd', "we'd": 'wiːd', "they'd": 'ðeɪd',
  "that's": 'ðæts', "what's": 'wɒts', "where's": 'weəz', "who's": 'huːz', "how's": 'haʊz', "here's": 'hɪəz', "there's": 'ðeəz',
  "let's": 'lets', "don't": 'dəʊnt', "doesn't": 'ˈdʌznt', "didn't": 'ˈdɪdnt', "isn't": 'ˈɪznt', "aren't": 'ɑːnt', "wasn't": 'ˈwɒznt',
  "weren't": 'wɜːnt', "can't": 'kɑːnt', "couldn't": 'ˈkʊdnt', "won't": 'wəʊnt', "wouldn't": 'ˈwʊdnt', "shouldn't": 'ˈʃʊdnt',
  "haven't": 'ˈhævnt', "hasn't": 'ˈhæznt', "hadn't": 'ˈhædnt', "mustn't": 'ˈmʌsnt', "that'll": 'ˈðætl', "there'll": 'ðeəl',
};
// Bất quy tắc thường gặp A1–A2 (quá khứ, phân từ, số nhiều, so sánh) + vài từ hay gặp ngoài danh sách từ.
const IRR: Record<string, string> = {
  went: 'went', gone: 'ɡɒn', got: 'ɡɒt', said: 'sed', says: 'sez', gave: 'ɡeɪv', given: 'ˈɡɪvn', done: 'dʌn', made: 'meɪd',
  came: 'keɪm', saw: 'sɔː', seen: 'siːn', took: 'tʊk', taken: 'ˈteɪkən', ate: 'et', eaten: 'ˈiːtn', drank: 'dræŋk', drunk: 'drʌŋk',
  bought: 'bɔːt', brought: 'brɔːt', thought: 'θɔːt', caught: 'kɔːt', taught: 'tɔːt', fought: 'fɔːt', found: 'faʊnd', told: 'təʊld',
  sold: 'səʊld', felt: 'felt', left: 'left', kept: 'kept', slept: 'slept', met: 'met', sent: 'sent', spent: 'spent', built: 'bɪlt',
  lost: 'lɒst', paid: 'peɪd', heard: 'hɜːd', wore: 'wɔː', worn: 'wɔːn', wrote: 'rəʊt', written: 'ˈrɪtn', rode: 'rəʊd', ridden: 'ˈrɪdn',
  ran: 'ræn', sang: 'sæŋ', sung: 'sʌŋ', swam: 'swæm', began: 'bɪˈɡæn', begun: 'bɪˈɡʌn', became: 'bɪˈkeɪm', broke: 'brəʊk',
  broken: 'ˈbrəʊkən', chose: 'tʃəʊz', chosen: 'ˈtʃəʊzn', drove: 'drəʊv', driven: 'ˈdrɪvn', fell: 'fel', fallen: 'ˈfɔːlən', flew: 'fluː',
  flown: 'fləʊn', forgot: 'fəˈɡɒt', forgotten: 'fəˈɡɒtn', grew: 'ɡruː', grown: 'ɡrəʊn', held: 'held', knew: 'njuː', known: 'nəʊn',
  led: 'led', lent: 'lent', meant: 'ment', rang: 'ræŋ', rung: 'rʌŋ', rose: 'rəʊz', sat: 'sæt', spoke: 'spəʊk', spoken: 'ˈspəʊkən',
  stood: 'stʊd', stole: 'stəʊl', threw: 'θruː', thrown: 'θrəʊn', understood: 'ˌʌndəˈstʊd', woke: 'wəʊk', won: 'wʌn', hid: 'hɪd',
  shook: 'ʃʊk', bit: 'bɪt', blew: 'bluː', drew: 'druː', drawn: 'drɔːn', dug: 'dʌɡ', fed: 'fed', fled: 'fled', hung: 'hʌŋ', lit: 'lɪt',
  shot: 'ʃɒt', shone: 'ʃɒn', stuck: 'stʌk', swung: 'swʌŋ', tore: 'tɔː', torn: 'tɔːn', wound: 'waʊnd', bent: 'bent', dealt: 'delt',
  children: 'ˈtʃɪldrən', people: 'ˈpiːpl', men: 'men', women: 'ˈwɪmɪn', man: 'mæn', woman: 'ˈwʊmən', feet: 'fiːt', teeth: 'tiːθ',
  mice: 'maɪs', better: 'ˈbetə', best: 'best', worse: 'wɜːs', worst: 'wɜːst', more: 'mɔː', most: 'məʊst', less: 'les', least: 'liːst',
  further: 'ˈfɜːðə', farther: 'ˈfɑːðə', many: 'ˈmeni', much: 'mʌtʃ', every: 'ˈevri', everyone: 'ˈevriwʌn', everything: 'ˈevriθɪŋ',
  someone: 'ˈsʌmwʌn', something: 'ˈsʌmθɪŋ', anything: 'ˈeniθɪŋ', nothing: 'ˈnʌθɪŋ', nobody: 'ˈnəʊbədi', somebody: 'ˈsʌmbədi',
  anyone: 'ˈeniwʌn', myself: 'maɪˈself', yourself: 'jɔːˈself', himself: 'hɪmˈself', herself: 'həˈself', ourselves: 'aʊəˈselvz',
  themselves: 'ðəmˈselvz', itself: 'ɪtˈself', mine: 'maɪn', yours: 'jɔːz', hers: 'hɜːz', ours: 'ˈaʊəz', theirs: 'ðeəz',
  goodbye: 'ɡʊdˈbaɪ', bye: 'baɪ', thanks: 'θæŋks', thank: 'θæŋk', sorry: 'ˈsɒri', sure: 'ʃɔː', well: 'wel', oh: 'əʊ', great: 'ɡreɪt',
  today: 'təˈdeɪ', tonight: 'təˈnaɪt', tomorrow: 'təˈmɒrəʊ', yesterday: 'ˈjestədeɪ', now: 'naʊ', again: 'əˈɡen', always: 'ˈɔːlweɪz',
  usually: 'ˈjuːʒuəli', often: 'ˈɒfn', sometimes: 'ˈsʌmtaɪmz', never: 'ˈnevə', soon: 'suːn', later: 'ˈleɪtə', still: 'stɪl',
  only: 'ˈəʊnli', really: 'ˈrɪəli', quite: 'kwaɪt', each: 'iːtʃ', other: 'ˈʌðə', another: 'əˈnʌðə', both: 'bəʊθ', own: 'əʊn',
  after: 'ˈɑːftə', before: 'bɪˈfɔː', near: 'nɪə', next: 'nekst', over: 'ˈəʊvə', under: 'ˈʌndə', around: 'əˈraʊnd', across: 'əˈkrɒs',
  behind: 'bɪˈhaɪnd', between: 'bɪˈtwiːn', opposite: 'ˈɒpəzɪt', outside: 'ˌaʊtˈsaɪd', inside: 'ˌɪnˈsaɪd', down: 'daʊn', away: 'əˈweɪ',
  back: 'bæk', home: 'həʊm', clock: 'klɒk', "o'clock": 'əˈklɒk', pm: 'ˌpiːˈem',
  zero: 'ˈzɪərəʊ', two: 'tuː', three: 'θriː', four: 'fɔː', five: 'faɪv', six: 'sɪks', seven: 'ˈsevn', eight: 'eɪt', nine: 'naɪn',
  ten: 'ten', eleven: 'ɪˈlevn', twelve: 'twelv', thirteen: 'ˌθɜːˈtiːn', fourteen: 'ˌfɔːˈtiːn', fifteen: 'ˌfɪfˈtiːn', sixteen: 'ˌsɪksˈtiːn',
  seventeen: 'ˌsevnˈtiːn', eighteen: 'ˌeɪˈtiːn', nineteen: 'ˌnaɪnˈtiːn', twenty: 'ˈtwenti', thirty: 'ˈθɜːti', forty: 'ˈfɔːti',
  fifty: 'ˈfɪfti', sixty: 'ˈsɪksti', seventy: 'ˈsevnti', eighty: 'ˈeɪti', ninety: 'ˈnaɪnti', hundred: 'ˈhʌndrəd', thousand: 'ˈθaʊznd',
  first: 'fɜːst', second: 'ˈsekənd', third: 'θɜːd', fourth: 'fɔːθ', fifth: 'fɪfθ', tenth: 'tenθ', half: 'hɑːf', quarter: 'ˈkwɔːtə',
  monday: 'ˈmʌndeɪ', tuesday: 'ˈtjuːzdeɪ', wednesday: 'ˈwenzdeɪ', thursday: 'ˈθɜːzdeɪ', friday: 'ˈfraɪdeɪ', saturday: 'ˈsætədeɪ',
  sunday: 'ˈsʌndeɪ', january: 'ˈdʒænjuəri', february: 'ˈfebruəri', march: 'mɑːtʃ', april: 'ˈeɪprəl', may: 'meɪ', june: 'dʒuːn',
  july: 'dʒuˈlaɪ', august: 'ˈɔːɡəst', september: 'sepˈtembə', october: 'ɒkˈtəʊbə', november: 'nəʊˈvembə', december: 'dɪˈsembə',
  english: 'ˈɪŋɡlɪʃ', vietnamese: 'ˌvjetnəˈmiːz', vietnam: 'ˌvjetˈnæm', café: 'ˈkæfeɪ', cafe: 'ˈkæfeɪ', photo: 'ˈfəʊtəʊ',
  minute: 'ˈmɪnɪt', hour: 'ˈaʊə', year: 'jɪə', day: 'deɪ', week: 'wiːk', month: 'mʌnθ', time: 'taɪm', good: 'ɡʊd', bad: 'bæd',
  big: 'bɪɡ', small: 'smɔːl', new: 'njuː', old: 'əʊld', nice: 'naɪs', like: 'laɪk', love: 'lʌv', want: 'wɒnt', need: 'niːd',
  go: 'ɡəʊ', come: 'kʌm', get: 'ɡet', make: 'meɪk', take: 'teɪk', see: 'siː', look: 'lʊk', know: 'nəʊ', think: 'θɪŋk', say: 'seɪ',
  tell: 'tel', give: 'ɡɪv', work: 'wɜːk', live: 'lɪv', play: 'pleɪ', eat: 'iːt', drink: 'drɪŋk', buy: 'baɪ', pay: 'peɪ', help: 'help',
  stay: 'steɪ', start: 'stɑːt', stop: 'stɒp', open: 'ˈəʊpən', close: 'kləʊz', wait: 'weɪt', watch: 'wɒtʃ', walk: 'wɔːk', talk: 'tɔːk',
  call: 'kɔːl', ask: 'ɑːsk', answer: 'ˈɑːnsə', try: 'traɪ', use: 'juːz', put: 'pʊt', let: 'let', keep: 'kiːp', leave: 'liːv',
  last: 'lɑːst', long: 'lɒŋ', right: 'raɪt', little: 'ˈlɪtl', lot: 'lɒt', fine: 'faɪn', thing: 'θɪŋ', way: 'weɪ', place: 'pleɪs',
  room: 'ruːm', water: 'ˈwɔːtə', hot: 'hɒt', cold: 'kəʊld', warm: 'wɔːm', cool: 'kuːl', windy: 'ˈwɪndi', sunny: 'ˈsʌni',
  rainy: 'ˈreɪni', cloud: 'klaʊd', lovely: 'ˈlʌvli', tourist: 'ˈtʊərɪst', tour: 'tʊə', visitor: 'ˈvɪzɪtə', homestay: 'ˈhəʊmsteɪ',
  entrance: 'ˈentrəns', game: 'ɡeɪm', guide: 'ɡaɪd', guest: 'ɡest', car: 'kɑː', degree: 'dɪˈɡriː', brother: 'ˈbrʌðə',
  father: 'ˈfɑːðə', mother: 'ˈmʌðə', sister: 'ˈsɪstə', friend: 'frend', family: 'ˈfæməli', name: 'neɪm', class: 'klɑːs',
  school: 'skuːl', teacher: 'ˈtiːtʃə', student: 'ˈstjuːdnt', ticket: 'ˈtɪkɪt', train: 'treɪn', bus: 'bʌs',
  street: 'striːt', city: 'ˈsɪti', town: 'taʊn', country: 'ˈkʌntri', world: 'wɜːld', hard: 'hɑːd', easy: 'ˈiːzi', quiet: 'ˈkwaɪət',
  busy: 'ˈbɪzi', ready: 'ˈredi', happy: 'ˈhæpi', tired: 'ˈtaɪəd', hungry: 'ˈhʌŋɡri', thirsty: 'ˈθɜːsti', late: 'leɪt', early: 'ˈɜːli',
  korea: 'kəˈriːə', australia: 'ɒˈstreɪliə', france: 'frɑːns', japan: 'dʒəˈpæn', china: 'ˈtʃaɪnə', america: 'əˈmerɪkə',
  worry: 'ˈwʌri', kilo: 'ˈkiːləʊ', croissant: 'ˈkwæsɒn', bun: 'bʌn', picnic: 'ˈpɪknɪk', popcorn: 'ˈpɒpkɔːn', sell: 'sel', fill: 'fɪl',
  boring: 'ˈbɔːrɪŋ', motorbike: 'ˈməʊtəbaɪk', runner: 'ˈrʌnə', sofa: 'ˈsəʊfə', lantern: 'ˈlæntən', laboratory: 'ləˈbɒrətri',
  danger: 'ˈdeɪndʒə', heat: 'hiːt', seafood: 'ˈsiːfuːd', zoo: 'zuː', grammar: 'ˈɡræmə', badminton: 'ˈbædmɪntən', pizza: 'ˈpiːtsə',
  learnt: 'lɜːnt', quiz: 'kwɪz', shoe: 'ʃuː', lifeguard: 'ˈlaɪfɡɑːd', ninth: 'naɪnθ', aloud: 'əˈlaʊd', policewoman: 'pəˈliːswʊmən',
  sew: 'səʊ', housework: 'ˈhaʊswɜːk', realise: 'ˈrɪəlaɪz', smoke: 'sməʊk', decoration: 'ˌdekəˈreɪʃn', homemade: 'ˌhəʊmˈmeɪd',
  olive: 'ˈɒlɪv', oily: 'ˈɔɪli', wildlife: 'ˈwaɪldlaɪf', real: 'rɪəl', violence: 'ˈvaɪələns', animated: 'ˈænɪmeɪtɪd', advert: 'ˈædvɜːt',
  bakery: 'ˈbeɪkəri', neighbourhood: 'ˈneɪbəhʊd', weigh: 'weɪ', keeper: 'ˈkiːpə', honey: 'ˈhʌni', choice: 'tʃɔɪs', triangle: 'ˈtraɪæŋɡl',
  villager: 'ˈvɪlɪdʒə', musical: 'ˈmjuːzɪkl', roast: 'rəʊst', grandma: 'ˈɡrænmɑː', lunchtime: 'ˈlʌntʃtaɪm', pork: 'pɔːk', grill: 'ɡrɪl',
  colourful: 'ˈkʌləfl', grandpa: 'ˈɡrænpɑː', aquarium: 'əˈkweəriəm', sleepy: 'ˈsliːpi', minus: 'ˈmaɪnəs', scarf: 'skɑːf', coral: 'ˈkɒrəl',
  london: 'ˈlʌndən', lotus: 'ˈləʊtəs', dong: 'dɒŋ',
};
// Từ tiếng Việt viết không dấu trong bài (phở, bánh chưng…): không phiên âm, coi như tên riêng.
const VI_WORD = new Set(['pho', 'banh', 'chung', 'cha', 'gio', 'ao', 'dai', 'nem', 'tet', 'xe', 'om', 'com']);
const WH = new Set(['what', 'where', 'when', 'who', 'why', 'how', 'which', 'whose']);

// ---------- Âm vị ----------
const SEG = /tʃ|dʒ|eɪ|aɪ|ɔɪ|aʊ|əʊ|ɪə|eə|ʊə|iː|ɑː|ɔː|uː|ɜː|./g;
const VOW = /^(eɪ|aɪ|ɔɪ|aʊ|əʊ|ɪə|eə|ʊə|iː|ɑː|ɔː|uː|ɜː|[ɪeæʌɒʊəiuɑɔɜ])$/;
const segs = (ipa: string): string[] => (ipa.replace(/[ˈˌ.]/g, '').match(SEG) ?? []).filter(s => s !== ' ');
const isV = (s: string | undefined) => !!s && VOW.test(s);
const lastSeg = (ipa: string) => { const s = segs(ipa); return s[s.length - 1] ?? ''; };
const firstSeg = (ipa: string) => segs(ipa)[0] ?? '';
// Lấy biến thể đầu, bỏ phần tuỳ chọn "(r)", "(ə)".
const clean = (ipa: string) => ipa.replace(/^\/|\/$/g, '').split(/\s*[,;]\s*|\s+\/\s*/)[0]!.replace(/\([^)]*\)/g, '').replace(/\//g, '').trim();

const SIB = new Set(['s', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ']), VL = new Set(['p', 't', 'k', 'f', 'θ']);
// Danh sách từ ghi /r/ cuối ở vài từ (chair /tʃeər/): trước đuôi phụ âm thì bỏ (giọng Anh không đọc r trước phụ âm).
const noR = (ipa: string) => ipa.replace(/(?<=[əːɪʊe])r$/, '');
const plusS = (ipa0: string) => { const ipa = noR(ipa0), l = lastSeg(ipa); return ipa + (SIB.has(l) ? 'ɪz' : VL.has(l) ? 's' : 'z'); };
const plusEd = (ipa0: string) => { const ipa = noR(ipa0), l = lastSeg(ipa); return ipa + (l === 't' || l === 'd' ? 'ɪd' : VL.has(l) || ['s', 'ʃ', 'tʃ'].includes(l) ? 't' : 'd'); };
const dropR = (ipa: string) => ipa.replace(/ə$/, '').replace(/ɜː$/, 'ɜːr');

// Tra IPA một từ đã viết thường; trả về ipa + loại đuôi (nếu ghép từ đuôi -s / -ed).
function lookup(w: string, ipaOf: IpaOf): { ipa: string; suf?: 's' | 'ed'; der?: true } | null {
  const base = (x: string): string | undefined => { const v = IRR[x] ?? FN[x]?.[0] ?? ipaOf(x); return v ? clean(v) : undefined; };
  const d = base(w); if (d) return { ipa: d };
  if (CONTR[w]) return { ipa: CONTR[w]! };
  const r = derive(w, ipaOf, base); return r ? { ...r, der: true } : null;
}
function derive(w: string, ipaOf: IpaOf, base: (x: string) => string | undefined): { ipa: string; suf?: 's' | 'ed' } | null {
  const tryB = (stems: string[], f: (ipa: string) => string, suf?: 's' | 'ed') => { for (const s of stems) { const b = s.length >= 2 ? base(s) : undefined; if (b) return { ipa: f(b), ...(suf ? { suf } : {}) }; } return null; };
  const dbl = (s: string) => (/([bdgklmnprt])\1$/.test(s) ? [s.slice(0, -1)] : []);
  let m: RegExpMatchArray | null;
  if ((m = w.match(/^(.+)'s$/)) || (m = w.match(/^(.+s)'$/))) { const b = lookup(m[1]!, ipaOf); if (b) return { ipa: w.endsWith("s'") ? b.ipa : plusS(b.ipa), suf: 's' }; }
  if ((m = w.match(/^(.+)ies$/))) { const r = tryB([m[1] + 'y'], plusS, 's'); if (r) return r; }
  // -s trước (ones → one, takes → take); -es chỉ sau s / x / z / ch / sh / o (buses, boxes, watches, goes).
  if ((m = w.match(/^(.+)s$/)) && !w.endsWith('ss')) { const r = tryB([m[1]!], plusS, 's'); if (r) return r; }
  if ((m = w.match(/^(.+(?:s|x|z|ch|sh|o))es$/))) { const r = tryB([m[1]!], plusS, 's'); if (r) return r; }
  if ((m = w.match(/^(.+)ied$/))) { const r = tryB([m[1] + 'y'], plusEd, 'ed'); if (r) return r; }
  if ((m = w.match(/^(.+)ed$/))) { const r = tryB([m[1]!, m[1] + 'e', ...dbl(m[1]!)], plusEd, 'ed'); if (r) return r; }
  if ((m = w.match(/^(.+)ing$/))) { const r = tryB([m[1]!, m[1] + 'e', ...dbl(m[1]!)], b => b + 'ɪŋ'); if (r) return r; }
  if ((m = w.match(/^(.+)iest$/))) { const r = tryB([m[1] + 'y'], b => b.replace(/i$/, '') + 'iɪst'); if (r) return r; }
  if ((m = w.match(/^(.+)ier$/))) { const r = tryB([m[1] + 'y'], b => b.replace(/i$/, '') + 'iə'); if (r) return r; }
  if ((m = w.match(/^(.+)est$/))) { const r = tryB([m[1]!, m[1] + 'e', ...dbl(m[1]!)], b => dropR(b) + 'ɪst'); if (r) return r; }
  if ((m = w.match(/^(.+)er$/))) { const r = tryB([m[1]!, m[1] + 'e', ...dbl(m[1]!)], b => dropR(b) + 'ə'); if (r) return r; }
  if ((m = w.match(/^(.+)ily$/))) { const r = tryB([m[1] + 'y'], b => b.replace(/i$/, '') + 'ɪli'); if (r) return r; }
  // final → finally /ˈfaɪnəli/; gentle → gently /ˈdʒentli/; quick → quickly.
  if ((m = w.match(/^(.+l)ly$/))) { const r = tryB([m[1]!], b => b.replace(/(?<!ə)l$/, 'əl') + 'i'); if (r) return r; }
  if ((m = w.match(/^(.+)ly$/))) { const r = tryB([m[1]!], b => b + 'li') ?? tryB([m[1] + 'le'], b => b.replace(/ə?l$/, '') + 'li'); if (r) return r; }
  if ((m = w.match(/^un(.+)$/))) { const r = tryB([m[1]!], b => 'ʌn' + b.replace(/^ˈ/, 'ˈ')); if (r) return r; }
  if (w.includes('-')) { const ps = w.split('-').map(p => lookup(p, ipaOf)); if (ps.every(Boolean)) return { ipa: ps.map(p => p!.ipa).join(' ') }; }
  return null;
}

// Âm cuối người Việt hay nuốt: đuôi -s / -ed; cụm phụ âm cuối; phụ âm xát / tắc xát cuối.
const HARD_END = new Set(['s', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'θ', 'ð', 'f', 'v']);
function endOf(ipa: string, suf?: 's' | 'ed'): PnTok['end'] {
  const s = segs(ipa); if (!s.length || isV(s[s.length - 1])) return undefined;
  let k = s.length; while (k > 0 && !isV(s[k - 1])) k--;
  const tail = s.slice(k).join('');
  if (suf === 's') return { k: 's', ipa: s[s.length - 1] === 'z' && s[s.length - 2] === 'ɪ' ? 'ɪz' : s[s.length - 1]! };
  if (suf === 'ed') return { k: 'ed', ipa: s[s.length - 1] === 'd' && s[s.length - 2] === 'ɪ' ? 'ɪd' : s[s.length - 1]! };
  // l / n / m sau phụ âm là âm tiết (people /ˈpiːpl/, often /ˈɒfn/): không phải cụm phụ âm cuối.
  if (s.length - k >= 2 && /^[lnm]$/.test(s[s.length - 1]!)) return undefined;
  if (s.length - k >= 2 || HARD_END.has(s[s.length - 1]!)) return { k: 'cons', ipa: tail };
  return undefined;
}

// ---------- Mẹo ----------
const TIP = {
  s: (w: string, i: string) => ({ id: 'end-s', snd: 's-11', t: `Đuôi -s trong “${w}” đọc /${i}/: phát âm rõ, đừng nuốt. Sau âm vô thanh đọc /s/, sau âm hữu thanh đọc /z/, sau s / sh / ch đọc /ɪz/.` }),
  ed: (w: string, i: string) => ({ id: 'end-ed', snd: 's-10', t: `Đuôi -ed trong “${w}” đọc /${i}/. Sau t / d đọc /ɪd/; sau âm vô thanh (p, k, s, sh, ch, f) đọc /t/; còn lại đọc /d/.` }),
  cons: (w: string, i: string) => ({ id: 'end-c', snd: i.length > 1 ? 's-21' : 's-12', t: `“${w}” kết thúc bằng /${i}/: giữ âm cuối, bật nhẹ ra. Người Việt hay bỏ âm này.` }),
  th: (w: string) => ({ id: 'th', snd: 's-05', t: `/θ/ trong “${w}”: đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi; đừng đọc thành “th” hay “t” tiếng Việt.` }),
  dh: (w: string) => ({ id: 'dh', snd: 's-06', t: `/ð/ trong “${w}”: lưỡi giữa răng như /θ/ nhưng rung cổ họng; đừng đọc thành “đ”.` }),
  sh: (w: string) => ({ id: 'sh', snd: 's-07', t: `/ʃ/ trong “${w}”: tròn môi, cong lưỡi; khác “x” tiếng Việt.` }),
  ch: (w: string) => ({ id: 'ch', snd: 's-08', t: `/tʃ/ trong “${w}”: bật mạnh như “ch” có hơi, tròn môi.` }),
  dj: (w: string) => ({ id: 'dj', snd: 's-26', t: `/dʒ/ trong “${w}”: như /tʃ/ nhưng rung cổ họng.` }),
  v: (w: string) => ({ id: 'v', snd: 's-18', t: `/v/ trong “${w}”: răng trên chạm môi dưới, rung; đừng đọc thành /w/ hay “d”.` }),
  r: (w: string) => ({ id: 'r', snd: 's-14', t: `/r/ trong “${w}”: cong lưỡi, không chạm vòm miệng; khác “r” rung tiếng Việt.` }),
  z: (w: string) => ({ id: 'z', snd: 's-11', t: `/z/ trong “${w}”: như /s/ nhưng rung cổ họng.` }),
  link: (a: string, b: string) => ({ id: 'link', snd: null, t: `Nối âm: “${a} ${b}” đọc liền như một từ (phụ âm cuối nối sang nguyên âm đầu).` }),
  weak: (w: string, i: string) => ({ id: 'weak', snd: null, t: `“${w}” là từ chức năng: đọc nhẹ, nhanh /${i}/; nhấn vào các từ in đậm.` }),
  up: () => ({ id: 'tune', snd: null, t: 'Câu hỏi Có / Không: lên giọng ở cuối câu ↗.' }),
  down: () => ({ id: 'tune', snd: null, t: 'Câu hỏi có từ để hỏi (what, where…): xuống giọng ở cuối câu ↘.' }),
  stress: (w: string, i: string) => ({ id: 'stress', snd: null, t: `“${w}” /${i}/: nhấn mạnh và kéo dài âm tiết có dấu ˈ (in đậm).` }),
};

// Mẹo cho một từ máy không nghe ra (theo thứ tự: âm cuối → âm khó → trọng âm).
export function missTip(t: PnTok): PnTip {
  const w = t.r.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, ''), ipa = t.ipa;
  if (t.end) return TIP[t.end.k](w, t.end.ipa);
  const s = segs(ipa);
  if (s.includes('θ')) return TIP.th(w);
  if (s.includes('ð')) return TIP.dh(w);
  if (s.includes('ʃ')) return TIP.sh(w);
  if (s.includes('tʃ')) return TIP.ch(w);
  if (s.includes('dʒ')) return TIP.dj(w);
  if (s.includes('v')) return TIP.v(w);
  if (s.includes('r')) return TIP.r(w);
  if (s.includes('z')) return TIP.z(w);
  if (ipa.includes('ˈ') && s.filter(isV).length > 1) return TIP.stress(w, ipa);
  return { id: 'slow', snd: null, t: `“${w}”${ipa ? ` /${ipa}/` : ''}: nghe chậm rồi nói lại từ này, rõ từng âm.` };
}

// ---------- Chú thích một câu ----------
export function noteOf(sentence: string, ipaOf: IpaOf): PnNote {
  const raw = sentence.replace(/[“”]/g, '"').replace(/[’‘]/g, "'").split(/\s+/).filter(Boolean);
  const toks: PnTok[] = raw.map((r, i) => {
    const w = r.toLowerCase().replace(/^[^a-z0-9'é]+|[^a-z0-9'é]+$/g, '').replace(/^'+|'+$/g, '');
    if (!w || /\d/.test(w)) return { r, w, ipa: '', kind: 'num', content: true };
    if (VI_WORD.has(w)) return { r, w, ipa: '', kind: 'name', content: true };
    const f = FN[w], lk = lookup(w, ipaOf), cap = /^[A-Z]/.test(r.replace(/^[^A-Za-z]+/, '')) && w !== 'i';
    // Viết hoa giữa câu mà chỉ ghép được bằng luật đuôi (Peter ≠ pet + -er) thì là tên riêng.
    if (!lk || cap && lk.der && i > 0) return { r, w, ipa: '', kind: cap ? 'name' : 'unk', content: true };
    const content = !f || FN_CONTENT.has(w) || /n't$/.test(w);
    return { r, w, ipa: lk.ipa, kind: 'word', content, ...(lk.suf || !f ? (() => { const e = endOf(lk.ipa, lk.suf); return e ? { end: e } : {}; })() : {}) } as PnTok;
  });
  const ends = (k: number) => /[.,!?;:—–]["')]*$/.test(raw[k] ?? '');
  // Từ đọc nhẹ: từ chức năng có dạng nhẹ, không đứng cuối câu / trước dấu câu, không phải từ đầu câu hỏi "Do / Can" đứng một mình.
  toks.forEach((t, k) => {
    const f = FN[t.w]; if (!f || !f[1] || t.content || ends(k) || k === toks.length - 1) return;
    let wk = f[1];
    if (t.w === 'the' && isV(firstSeg(toks[k + 1]?.ipa ?? ''))) wk = 'ði';
    if (t.w === 'to' && isV(firstSeg(toks[k + 1]?.ipa ?? ''))) wk = 'tu';
    t.strong = f[0]; t.weak = wk; t.ipa = wk;
  });
  // Nối âm: phụ âm cuối + nguyên âm đầu (không qua dấu câu); nối /r/: chữ tận cùng r / re + nguyên âm đầu.
  toks.forEach((t, k) => {
    const n = toks[k + 1]; if (!n || ends(k) || !t.ipa || !n.ipa || /'/.test(n.w) && !/^(it's|i'm)$/.test(n.w)) return;
    const a = lastSeg(t.ipa), b = firstSeg(n.ipa);
    if (!isV(b)) return;
    if (a && !isV(a) && a !== 'h') t.link = '';
    else if (/r(e)?$/.test(t.w) && isV(a)) t.link = 'r';
  });
  // Ngữ điệu theo câu cuối cùng trong dòng ("Hi, Ngoc! How's it going?" → câu "How's it going?" có từ để hỏi → ↘).
  const last = raw[raw.length - 1] ?? '', k0 = raw.slice(0, -1).reduce((p, r, k) => (/[.!?]["')]*$/.test(r) ? k + 1 : p), 0);
  const first = (toks[k0]?.w ?? '').replace(/'.*$/, '');
  const tune: PnNote['tune'] = /\?["')]*$/.test(last) && !WH.has(first) ? '↗' : '↘';
  // Mẹo: tối đa 3, khác loại, theo thứ tự ưu tiên lỗi người Việt.
  const tips: PnTip[] = [], has = (id: string) => tips.some(x => x.id === id), add = (x: PnTip | null) => { if (x && !has(x.id) && tips.length < 3) tips.push(x); };
  const wd = (t: PnTok) => t.r.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');
  const firstTok = (p: (t: PnTok) => boolean) => toks.find(p);
  const ts = firstTok(t => t.end?.k === 's'); if (ts) add(TIP.s(wd(ts), ts.end!.ipa));
  const te = firstTok(t => t.end?.k === 'ed'); if (te) add(TIP.ed(wd(te), te.end!.ipa));
  const tc = firstTok(t => t.end?.k === 'cons' && t.content); if (tc) add(TIP.cons(wd(tc), tc.end!.ipa));
  for (const [seg, f] of [['θ', TIP.th], ['ð', TIP.dh], ['ʃ', TIP.sh], ['tʃ', TIP.ch], ['v', TIP.v]] as const) {
    const t = firstTok(x => segs(x.ipa).includes(seg) && (seg !== 'ð' || x.content)); if (t) add(f(wd(t)));
  }
  const tl = toks.findIndex(t => t.link === ''); if (tl >= 0) add(TIP.link(wd(toks[tl]!), wd(toks[tl + 1]!)));
  const tw = firstTok(t => !!t.weak); if (tw) add(TIP.weak(wd(tw), tw.weak!));
  if (/\?["')]*$/.test(last)) add(tune === '↗' ? TIP.up() : TIP.down());
  return { toks, tune, tips };
}

// Tách bài đọc thành câu (giữ Mr. / Mrs. / Dr. / số thập phân / giờ 9.30).
export function sentencesOf(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  const parts = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?]["')]?)\s+(?=["'(]?[A-Z0-9])/);
  for (const p of parts) {
    cur = cur ? `${cur} ${p}` : p;
    if (/\b(Mr|Mrs|Ms|Dr|St)\.$/.test(cur)) continue;
    out.push(cur); cur = '';
  }
  if (cur) out.push(cur);
  return out.filter(Boolean);
}

// Độ phủ (cho test / công cụ): tỉ lệ từ có IPA trên tổng số từ, không tính tên riêng và số.
export function coverage(lines: string[], ipaOf: IpaOf): { n: number; hit: number; miss: Map<string, number> } {
  let n = 0, hit = 0; const miss = new Map<string, number>();
  for (const l of lines) for (const t of noteOf(l, ipaOf).toks) {
    if (t.kind === 'name' || t.kind === 'num') continue;
    n++; if (t.ipa) hit++; else miss.set(t.w, (miss.get(t.w) ?? 0) + 1);
  }
  return { n, hit, miss };
}

// ---------- v143 Phân tích bài dán vào: từ gốc + gợi ý ngữ pháp (chạy trên máy, không dịch cả câu) ----------
// Bất quy tắc → từ gốc (cùng bảng với wordLevel của app.js, thêm vài từ).
const IRR_BASE: Record<string, string> = {
  went: 'go', gone: 'go', goes: 'go', had: 'have', has: 'have', did: 'do', done: 'do', does: 'do', saw: 'see', seen: 'see', came: 'come',
  got: 'get', gotten: 'get', made: 'make', took: 'take', taken: 'take', bought: 'buy', ate: 'eat', eaten: 'eat', drank: 'drink', drunk: 'drink',
  said: 'say', says: 'say', told: 'tell', gave: 'give', given: 'give', found: 'find', thought: 'think', met: 'meet', wrote: 'write', written: 'write',
  began: 'begin', begun: 'begin', knew: 'know', known: 'know', felt: 'feel', sat: 'sit', stood: 'stand', ran: 'run', swam: 'swim', swum: 'swim',
  flew: 'fly', flown: 'fly', slept: 'sleep', spent: 'spend', lost: 'lose', won: 'win', became: 'become', brought: 'bring', caught: 'catch',
  taught: 'teach', heard: 'hear', paid: 'pay', sold: 'sell', sent: 'send', built: 'build', drove: 'drive', driven: 'drive', forgot: 'forget',
  forgotten: 'forget', broke: 'break', broken: 'break', chose: 'choose', chosen: 'choose', woke: 'wake', wore: 'wear', worn: 'wear', left: 'leave',
  kept: 'keep', meant: 'mean', spoke: 'speak', spoken: 'speak', understood: 'understand', grew: 'grow', grown: 'grow', threw: 'throw',
  thrown: 'throw', fell: 'fall', fallen: 'fall', held: 'hold', led: 'lead', rode: 'ride', ridden: 'ride', sang: 'sing', sung: 'sing',
  learnt: 'learn', lent: 'lend', shot: 'shoot', hid: 'hide', shook: 'shake', drew: 'draw', drawn: 'draw', fed: 'feed', hung: 'hang',
  children: 'child', people: 'person', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth', mice: 'mouse',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad', was: 'be', were: 'be', been: 'be', am: 'be', is: 'be', are: 'be',
};
const PAST_IRR = new Set(['went', 'had', 'did', 'saw', 'came', 'got', 'made', 'took', 'bought', 'ate', 'drank', 'said', 'told', 'gave', 'found',
  'thought', 'met', 'wrote', 'began', 'knew', 'felt', 'sat', 'stood', 'ran', 'swam', 'flew', 'slept', 'spent', 'lost', 'won', 'became', 'brought',
  'caught', 'taught', 'heard', 'paid', 'sold', 'sent', 'built', 'drove', 'forgot', 'broke', 'chose', 'woke', 'wore', 'left', 'kept', 'meant',
  'spoke', 'understood', 'grew', 'threw', 'fell', 'held', 'led', 'rode', 'sang', 'learnt', 'lent', 'shot', 'hid', 'shook', 'drew', 'fed', 'hung']);
const PART_IRR = new Set(['gone', 'done', 'seen', 'been', 'had', 'got', 'gotten', 'made', 'taken', 'bought', 'eaten', 'drunk', 'said', 'told', 'given',
  'found', 'met', 'written', 'begun', 'known', 'felt', 'stood', 'run', 'swum', 'flown', 'slept', 'spent', 'lost', 'won', 'become', 'brought',
  'caught', 'taught', 'heard', 'paid', 'sold', 'sent', 'built', 'driven', 'forgotten', 'broken', 'chosen', 'worn', 'left', 'kept', 'spoken',
  'understood', 'grown', 'thrown', 'fallen', 'held', 'ridden', 'sung', 'learnt', 'put', 'read', 'come', 'cut', 'hit', 'let', 'set']);
export type LemmaForm = '' | 'pl' | '3sg' | 'past' | 'part' | 'ing' | 'cmp' | 'sup' | 'adv' | 'poss' | 'irr';
export const FORM_VI: Record<LemmaForm, string> = { '': '', pl: 'thêm -s / -es (số nhiều hoặc ngôi 3)', '3sg': 'ngôi 3 số ít', past: 'quá khứ', part: 'quá khứ / phân từ', ing: 'đang / -ing', cmp: 'so sánh hơn', sup: 'so sánh nhất', adv: 'trạng từ', poss: 'sở hữu', irr: 'dạng bất quy tắc' };
// Từ gốc của một từ (đã viết thường) theo từ điển `has`: thử nguyên dạng → bất quy tắc → luật đuôi. Không ra thì trả về chính từ đó.
export function lemmaOf(w0: string, has: (w: string) => boolean): { base: string; f: LemmaForm } {
  const w = w0.toLowerCase().replace(/’/g, "'");
  if (has(w)) return { base: w, f: '' };
  if (IRR_BASE[w] && has(IRR_BASE[w]!)) return { base: IRR_BASE[w]!, f: /^(children|people|men|women|feet|teeth|mice)$/.test(w) ? 'pl' : /^(better|worse)$/.test(w) ? 'cmp' : /^(best|worst)$/.test(w) ? 'sup' : PAST_IRR.has(w) ? 'past' : PART_IRR.has(w) ? 'part' : 'irr' };
  const t = (xs: string[], f: LemmaForm) => { for (const x of xs) if (x.length >= 2 && has(x)) return { base: x, f }; return null; };
  const dbl = (s: string) => (/([bdgklmnprt])\1$/.test(s) ? [s.slice(0, -1)] : []);
  let m: RegExpMatchArray | null, r: { base: string; f: LemmaForm } | null = null;
  if ((m = w.match(/^(.+)'s$/))) r = t([m[1]!], 'poss');
  else if ((m = w.match(/^(.+)ies$/))) r = t([m[1] + 'y'], 'pl');
  else if ((m = w.match(/^(.+)s$/))) r = t([m[1]!], 'pl') ?? (/(s|x|z|ch|sh|o)es$/.test(w) ? t([w.slice(0, -2)], 'pl') : null);
  else if ((m = w.match(/^(.+)ied$/))) r = t([m[1] + 'y'], 'past');
  else if ((m = w.match(/^(.+)ed$/))) r = t([m[1]!, m[1] + 'e', ...dbl(m[1]!)], 'past');
  else if ((m = w.match(/^(.+)ing$/))) r = t([m[1]!, m[1] + 'e', ...dbl(m[1]!)], 'ing');
  else if ((m = w.match(/^(.+)iest$/))) r = t([m[1] + 'y'], 'sup');
  else if ((m = w.match(/^(.+)ier$/))) r = t([m[1] + 'y'], 'cmp');
  else if ((m = w.match(/^(.+)est$/))) r = t([m[1]!, m[1] + 'e', ...dbl(m[1]!)], 'sup');
  else if ((m = w.match(/^(.+)er$/))) r = t([m[1]!, m[1] + 'e', ...dbl(m[1]!)], 'cmp');
  else if ((m = w.match(/^(.+)ily$/))) r = t([m[1] + 'y'], 'adv');
  else if ((m = w.match(/^(.+)ly$/))) r = t([m[1]!, m[1] + 'le'], 'adv');
  return r ?? { base: w, f: '' };
}

// Gợi ý ngữ pháp một câu (tối đa 3), theo luật đơn giản trên chữ. Chỉ là gợi ý, không phải phân tích đầy đủ.
export interface GramHint { id: string; t: string }
export function grammarOf(sentence: string): GramHint[] {
  const s = sentence.replace(/[’‘]/g, "'"), w = s.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean), out: GramHint[] = [];
  const at = (re: RegExp) => w.findIndex(x => re.test(x)), add = (id: string, t: string) => { if (!out.some(x => x.id === id) && out.length < 3) out.push({ id, t }); };
  const BE = /^(am|is|are|i'm|you're|we're|they're|he's|she's|it's|that's)$/, ing = (k: number) => !!w[k] && /ing$/.test(w[k]!) && w[k]!.length > 4;
  const join = w.join(' ');
  let tense = false;
  const gi = w.findIndex((x, k) => BE.test(x) && w[k + 1] === 'going' && w[k + 2] === 'to');
  if (gi >= 0) { add('fut-go', `Tương lai gần “be going to + động từ” (${w.slice(gi, gi + 4).join(' ')}): dự định đã có.`); tense = true; }
  const wi = at(/^(will|won't|i'll|you'll|he'll|she'll|we'll|they'll|it'll)$/);
  if (wi >= 0) { add('fut-will', `Tương lai “will + động từ” (${w.slice(wi, wi + 2).join(' ')}): quyết định, dự đoán, lời hứa.`); tense = true; }
  const pp = w.findIndex((x, k) => /^(have|has|i've|you've|we've|they've|haven't|hasn't)$/.test(x) && !!w[k + 1] && (/ed$/.test(w[k + 1]!) || PART_IRR.has(w[k + 1]!) || (w[k + 1] === 'never' || w[k + 1] === 'already' || w[k + 1] === 'just') && !!w[k + 2] && (/ed$/.test(w[k + 2]!) || PART_IRR.has(w[k + 2]!))));
  // Câu hỏi đảo: "Have you (ever) tried …?" → hiện tại hoàn thành.
  const qpp = /^(have|has|haven't|hasn't)$/.test(w[0] ?? '') && w.slice(2, 5).some(x => /ed$/.test(x) || PART_IRR.has(x)) ? 0 : -1;
  if (pp < 0 && qpp === 0) { add('pres-perf', `Hiện tại hoàn thành, dạng câu hỏi “Have / Has + chủ ngữ + phân từ” (${w.slice(0, 4).join(' ')}): hỏi về trải nghiệm tới bây giờ.`); tense = true; }
  if (pp >= 0) { add('pres-perf', `Hiện tại hoàn thành “have / has + phân từ” (${w.slice(pp, pp + 2).join(' ')}): việc đã xảy ra, còn liên quan tới bây giờ.`); tense = true; }
  const pc = w.findIndex((x, k) => BE.test(x) && ing(k + 1) && w[k + 1] !== 'going');
  if (pc >= 0) { add('pres-cont', `Hiện tại tiếp diễn “am / is / are + V-ing” (${w.slice(pc, pc + 2).join(' ')}): việc đang diễn ra.`); tense = true; }
  const wc = w.findIndex((x, k) => /^(was|were)$/.test(x) && ing(k + 1));
  if (wc >= 0) { add('past-cont', `Quá khứ tiếp diễn “was / were + V-ing” (${w.slice(wc, wc + 2).join(' ')}): việc đang diễn ra lúc đó.`); tense = true; }
  if (!tense) {
    const ps = w.findIndex((x, k) => PAST_IRR.has(x) && !(x === 'left' && /^(on|to|the)$/.test(w[k - 1] ?? '')) || /^(was|were|did|didn't|wasn't|weren't)$/.test(x)
      || /ed$/.test(x) && x.length > 4 && !/^(have|has|had|was|were|is|are|be|been|get|got)$/.test(w[k - 1] ?? '') && !/^(need|bed|red|feed|speed|seed|hundred|tired|interested|bored|excited|married|used)$/.test(x));
    if (ps >= 0) { add('past', `Quá khứ đơn (${w[ps]}): việc đã xảy ra và đã xong trong quá khứ.`); tense = true; }
  }
  // Câu kể có chủ ngữ là đại từ + động từ thường (I need…, We usually make…) cũng là hiện tại đơn.
  const SUBJ = /^(i|you|we|they|he|she|it)$/, ADV = /^(usually|often|always|sometimes|never|also|really|just|only|still)$/;
  const subjVerb = w.some((x, k) => SUBJ.test(x) && !!w[k + 1] && !FN[w[k + 1]!] && !ADV.test(w[k + 1]!) || SUBJ.test(x) && ADV.test(w[k + 1] ?? '') && !!w[k + 2] && !FN[w[k + 2]!]);
  const hasModal = at(/^(can|could|must|should|may|might|would|can't|couldn't|mustn't|shouldn't|wouldn't)$/) >= 0 || /\b(have|has|had) to\b/.test(join);
  if (!tense && !hasModal && subjVerb && !/\?\s*$/.test(s)) add('pres', 'Hiện tại đơn: thói quen, sự thật, trạng thái (he / she / it thì động từ thêm -s / -es).');
  if (!tense && w.length >= 3 && at(/^(am|is|are|do|does|don't|doesn't|i'm|you're|we're|they're|he's|she's|it's)$/) >= 0 || !tense && w.some((x, k) => k > 0 && /^(he|she|it|[a-z]+)$/.test(w[k - 1]!) && /[^s]s$/.test(x) && x.length > 3 && /^(he|she|it)$/.test(w[k - 1]!)))
    add('pres', 'Hiện tại đơn: thói quen, sự thật, trạng thái (he / she / it thì động từ thêm -s / -es).');
  if (/\?\s*$/.test(s)) add('q', /^(what|where|when|who|why|how|which|whose)/.test(w[0] ?? '') ? `Câu hỏi có từ để hỏi (${w[0]}): xuống giọng ở cuối.` : 'Câu hỏi Có / Không: trợ động từ đứng trước chủ ngữ, lên giọng ở cuối.');
  if (at(/^(not|never|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|can't|won't|haven't|hasn't|couldn't|shouldn't|mustn't)$/) >= 0) add('neg', 'Câu phủ định (not / n\'t / never).');
  const md = at(/^(can|could|must|should|may|might|can't|couldn't|mustn't|shouldn't)$/);
  if (md >= 0) add('modal', `Động từ khuyết thiếu “${w[md]} + động từ nguyên mẫu”: ${/^(can|could|can't|couldn't)$/.test(w[md]!) ? 'khả năng / xin phép' : /^(must|mustn't)$/.test(w[md]!) ? 'bắt buộc / cấm' : /^(should|shouldn't)$/.test(w[md]!) ? 'lời khuyên' : 'có thể'}.`);
  if (/\bhave to\b|\bhas to\b|\bhad to\b/.test(join)) add('haveto', '“have to + động từ”: phải làm (do hoàn cảnh).');
  if (/\b(\w+er|more \w+|less \w+) than\b/.test(join)) add('cmp', 'So sánh hơn “-er / more … than”.');
  if (/\bthe (\w+est|most \w+|best|worst)\b/.test(join)) add('sup', 'So sánh nhất “the -est / the most …”.');
  if (/\bthere (is|are|was|were|'s)\b/.test(join) || /\bthere's\b/.test(join)) add('there', '“There is / are …”: có (cái gì ở đâu).');
  return out;
}
