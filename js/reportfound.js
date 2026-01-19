import { supabase } from './supabase.js';

// Enhanced County → Constituency → Chief's Office selection
const counties = {
    nairobi: {
        constituencies: ["Westlands", "Dagoretti North", "Dagoretti South", "Langata", "Kibra", "Roysambu", "Kasarani", "Ruaraka", "Embakasi South", "Embakasi North", "Embakasi Central", "Embakasi East", "Embakasi West", "Makadara", "Kamukunji", "Starehe", "Mathare"],
        chiefs: {
            "Westlands": ["Kangemi Chief's Office", "Mountain View Chief's Office", "Parklands Chief's Office", "Westlands Chief's Office"],
            "Dagoretti North": ["Uthiru Chief's Office", "Mutuini Chief's Office", "Riruta Chief's Office"],
            "Dagoretti South": ["Dagoretti Chief's Office", "Riruta Satellite Chief's Office", "Uthiru/Ruthimitu Chief's Office"],
            "Langata": ["Karen Chief's Office", "Langata Chief's Office", "Kibera Chief's Office"],
            "Kibra": ["Kibra Chief's Office", "Laini Saba Chief's Office", "Lindi Chief's Office"],
            "Roysambu": ["Githurai Chief's Office", "Kahawa West Chief's Office", "Zimmerman Chief's Office"],
            "Kasarani": ["Kasarani Chief's Office", "Clay City Chief's Office", "Mwiki Chief's Office"],
            "Ruaraka": ["Babadogo Chief's Office", "Utalii Chief's Office", "Mathare North Chief's Office"],
            "Embakasi South": ["Imara Daima Chief's Office", "Kwa Njenga Chief's Office", "Pipeline Chief's Office"],
            "Embakasi North": ["Kariobangi North Chief's Office", "Dandora Chief's Office"],
            "Embakasi Central": ["Kayole Chief's Office", "Komarock Chief's Office", "Matopeni Chief's Office"],
            "Embakasi East": ["Upper Savannah Chief's Office", "Lower Savannah Chief's Office", "Utawala Chief's Office"],
            "Embakasi West": ["Umoja Chief's Office", "Mowlem Chief's Office", "Kariobangi South Chief's Office"],
            "Makadara": ["Makadara Chief's Office", "Maringo/Hamza Chief's Office", "Viwandani Chief's Office"],
            "Kamukunji": ["Pumwani Chief's Office", "Eastleigh North Chief's Office", "Eastleigh South Chief's Office"],
            "Starehe": ["Nairobi Central Chief's Office", "Ngara Chief's Office", "Ziwani Chief's Office"],
            "Mathare": ["Hospital Chief's Office", "Mabatini Chief's Office", "Huruma Chief's Office"]
        }
    },
    mombasa: {
        constituencies: ["Changamwe", "Jomvu", "Kisauni", "Nyali", "Likoni", "Mvita"],
        chiefs: {
            "Changamwe": ["Changamwe Chief's Office", "Port Reitz Chief's Office", "Kipevu Chief's Office"],
            "Jomvu": ["Jomvu Chief's Office", "Mikindani Chief's Office", "Miritini Chief's Office"],
            "Kisauni": ["Mtongwe Chief's Office", "Junda Chief's Office", "Mtopanga Chief's Office", "Shanzu Chief's Office"],
            "Nyali": ["Kongowea Chief's Office", "Bamburi Chief's Office", "Frere Town Chief's Office", "Mkomani Chief's Office"],
            "Likoni": ["Likoni Chief's Office", "Shika Adabu Chief's Office", "Bofu Chief's Office"],
            "Mvita": ["Mombasa Island Chief's Office", "Majengo Chief's Office", "Tononoka Chief's Office"]
        }
    },
    nakuru: {
        constituencies: ["Nakuru Town West", "Nakuru Town East", "Njoro", "Molo", "Gilgil", "Naivasha", "Kuresoi South", "Kuresoi North", "Subukia", "Rongai", "Bahati"],
        chiefs: {
            "Nakuru Town West": ["Barut Chief's Office", "London Chief's Office", "Kapkures Chief's Office", "Rhoda Chief's Office"],
            "Nakuru Town East": ["Biashara Chief's Office", "Kivumbini Chief's Office", "Flamingo Chief's Office"],
            "Njoro": ["Njoro Chief's Office", "Maunarok Chief's Office", "Kihingo Chief's Office", "Nessuit Chief's Office"],
            "Molo": ["Molo Chief's Office", "Turi Chief's Office", "Mariashoni Chief's Office"],
            "Gilgil": ["Gilgil Chief's Office", "Elementaita Chief's Office", "Malewa West Chief's Office"],
            "Naivasha": ["Naivasha Chief's Office", "Maiella Chief's Office", "Viwandani Chief's Office", "Hells Gate Chief's Office"],
            "Kuresoi South": ["Keringet Chief's Office", "Amalo Chief's Office", "Kiptagich Chief's Office"],
            "Kuresoi North": ["Kiptororo Chief's Office", "Sirikwa Chief's Office", "Kabiyet Chief's Office"],
            "Subukia": ["Subukia Chief's Office", "Kabazi Chief's Office", "Waseges Chief's Office"],
            "Rongai": ["Rongai Chief's Office", "Visoi Chief's Office", "Mosop Chief's Office"],
            "Bahati": ["Bahati Chief's Office", "Lanet/Umoja Chief's Office", "Dundori Chief's Office"]
        }
    },
    kiambu: {
        constituencies: ["Gatundu South", "Gatundu North", "Juja", "Thika Town", "Ruiru", "Githunguri", "Kiambu", "Kiambaa", "Kabete", "Kikuyu", "Limuru", "Lari"],
        chiefs: {
            "Gatundu South": ["Gatundu South Chief's Office", "Ndarugu Chief's Office", "Kiamwangi Chief's Office"],
            "Gatundu North": ["Gatundu North Chief's Office", "Githobokoni Chief's Office", "Chania Chief's Office"],
            "Juja": ["Juja Chief's Office", "Theta Chief's Office", "Witeithie Chief's Office", "Kalimoni Chief's Office"],
            "Thika Town": ["Thika Municipal Chief's Office", "Kamenu Chief's Office", "Hospital Chief's Office"],
            "Ruiru": ["Ruiru Chief's Office", "Kahawa Sukari Chief's Office", "Githurai Chief's Office", "Kahawa Wendani Chief's Office"],
            "Githunguri": ["Githunguri Chief's Office", "Githiga Chief's Office", "Ikinu Chief's Office", "Ngewa Chief's Office"],
            "Kiambu": ["Kiambu Chief's Office", "Ndumberi Chief's Office", "Riabai Chief's Office", "Township Chief's Office"],
            "Kiambaa": ["Kiambaa Chief's Office", "Cianda Chief's Office", "Karuri Chief's Office", "Ndenderu Chief's Office"],
            "Kabete": ["Kabete Chief's Office", "Gitaru Chief's Office", "Muguga Chief's Office", "Nyadarua Chief's Office"],
            "Kikuyu": ["Kikuyu Chief's Office", "Kinoo Chief's Office", "Karai Chief's Office", "Nachu Chief's Office"],
            "Limuru": ["Limuru Chief's Office", "Tigoni Chief's Office", "Ndeiya Chief's Office", "Limuru Central Chief's Office"],
            "Lari": ["Lari/Kirenga Chief's Office", "Kamburu Chief's Office", "Kijabe Chief's Office", "Nyanduma Chief's Office"]
        }
    },
    kisumu: {
        constituencies: ["Kisumu East", "Kisumu West", "Kisumu Central", "Seme", "Nyando", "Muhoroni", "Nyakach"],
        chiefs: {
            "Kisumu East": ["Kajulu Chief's Office", "Kolwa Central Chief's Office", "Kolwa East Chief's Office"],
            "Kisumu West": ["North West Kisumu Chief's Office", "Central Kisumu Chief's Office", "Kisumu North Chief's Office"],
            "Kisumu Central": ["Kondele Chief's Office", "Market Milimani Chief's Office", "Railways Chief's Office"],
            "Seme": ["Seme Chief's Office", "North Seme Chief's Office", "West Seme Chief's Office", "Central Seme Chief's Office"],
            "Nyando": ["Awasi/Onjiko Chief's Office", "Ahero Chief's Office", "Kabonyo/Kanyagwal Chief's Office", "Kobura Chief's Office"],
            "Muhoroni": ["Muhoroni Chief's Office", "Miwani Chief's Office", "Ombeyi Chief's Office", "Masogo/Nyang'oma Chief's Office"],
            "Nyakach": ["South West Nyakach Chief's Office", "North Nyakach Chief's Office", "Central Nyakach Chief's Office", "West Nyakach Chief's Office"]
        }
    },
    uasin_gishu: {
        constituencies: ["Eldoret East", "Eldoret West", "Eldoret South", "Kapseret", "Kesses", "Moiben"],
        chiefs: {
            "Eldoret East": ["Eldoret East Chief's Office", "Langas Chief's Office", "Kamukunji Chief's Office"],
            "Eldoret West": ["Eldoret West Chief's Office", "Kapsoya Chief's Office", "Pioneer Chief's Office"],
            "Eldoret South": ["Eldoret South Chief's Office", "Kapsaos Chief's Office", "Ainabkoi Chief's Office"],
            "Kapseret": ["Kapseret Chief's Office", "Simat/Kapseret Chief's Office", "Ngenyilel Chief's Office"],
            "Kesses": ["Kesses Chief's Office", "Racecourse Chief's Office", "Cheptiret/Kipchamo Chief's Office"],
            "Moiben": ["Moiben Chief's Office", "Kaptagat Chief's Office", "Tembelio Chief's Office"]
        }
    },
    kakamega: {
        constituencies: ["Lugari", "Likuyani", "Malava", "Lurambi", "Navakholo", "Mumias West", "Mumias East", "Matungu", "Butere", "Khwisero", "Shinyalu", "Ikolomani"],
        chiefs: {
            "Lugari": ["Lugari Chief's Office", "Lumakanda Chief's Office", "Chekalini Chief's Office", "Lwandeti Chief's Office"],
            "Likuyani": ["Likuyani Chief's Office", "Sango Chief's Office", "Kongoni Chief's Office", "Nzoia Chief's Office"],
            "Malava": ["Malava Chief's Office", "West Kabras Chief's Office", "Chemuche Chief's Office", "Butali/Chegulo Chief's Office"],
            "Lurambi": ["Lurambi Chief's Office", "Mahiakalo Chief's Office", "Shirugu-Mugai Chief's Office"],
            "Navakholo": ["Navakholo Chief's Office", "Ingostse-Mathia Chief's Office", "Shinoyi-Shikomari-Esumeyia Chief's Office"],
            "Mumias West": ["Mumias West Chief's Office", "Mumias Central Chief's Office", "Etenje Chief's Office"],
            "Mumias East": ["Mumias East Chief's Office", "Lusheya/Lubinu Chief's Office", "Malaha/Isongo/Makunga Chief's Office"],
            "Matungu": ["Matungu Chief's Office", "Koyonzo Chief's Office", "Khalaba Chief's Office", "Mayoni Chief's Office"],
            "Butere": ["Butere Chief's Office", "Khwisero Chief's Office", "Marama West Chief's Office", "Marama Central Chief's Office"],
            "Khwisero": ["Khwisero Chief's Office", "Kisa East Chief's Office", "Kisa West Chief's Office", "Kisa Central Chief's Office"],
            "Shinyalu": ["Shinyalu Chief's Office", "Isukha East Chief's Office", "Isukha West Chief's Office", "Isukha Central Chief's Office"],
            "Ikolomani": ["Ikolomani Chief's Office", "Idakho South Chief's Office", "Idakho East Chief's Office", "Idakho North Chief's Office"]
        }
    },
    trans_nzoia: {
        constituencies: ["Cherangany", "Endebess", "Saboti", "Kiminini", "Kwanza"],
        chiefs: {
            "Cherangany": ["Cherangany Chief's Office", "Makutano Chief's Office", "Cheptais Chief's Office", "Motosiet Chief's Office"],
            "Endebess": ["Endebess Chief's Office", "Matumbei Chief's Office"],
            "Saboti": ["Saboti Chief's Office", "Tuwani Chief's Office", "Machewa Chief's Office"],
            "Kiminini": ["Kiminini Chief's Office", "Waitaluk Chief's Office", "Sirende Chief's Office"],
            "Kwanza": ["Kwanza Chief's Office", "Bidii Chief's Office", "Kapomboi Chief's Office"]
        }
    },
    bungoma: {
        constituencies: ["Mt Elgon", "Sirisia", "Kabuchai", "Bumula", "Kanduyi", "Webuye East", "Webuye West", "Kimilili", "Tongaren"],
        chiefs: {
            "Mt Elgon": ["Cheptais Chief's Office", "Chesikaki Chief's Office", "Chepyuk Chief's Office"],
            "Sirisia": ["Sirisia Chief's Office", "Namwela Chief's Office", "Malakisi Chief's Office"],
            "Kabuchai": ["Kabuchai Chief's Office", "Chwele Chief's Office", "Mukuyuni Chief's Office"],
            "Bumula": ["Bumula Chief's Office", "Khasoko Chief's Office", "Kabula Chief's Office", "Kimaeti Chief's Office"],
            "Kanduyi": ["Kanduyi Chief's Office", "Bukembe East Chief's Office", "Bukembe West Chief's Office", "Township Chief's Office"],
            "Webuye East": ["Webuye East Chief's Office", "Mihuu Chief's Office", "Ndivisi Chief's Office"],
            "Webuye West": ["Webuye West Chief's Office", "Sitikho Chief's Office", "Matulo Chief's Office"],
            "Kimilili": ["Kimilili Chief's Office", "Maeni Chief's Office", "Kibingei Chief's Office"],
            "Tongaren": ["Tongaren Chief's Office", "Naitiri/Kabuyefwe Chief's Office", "Milima Chief's Office", "Ndalu/Tabani Chief's Office"]
        }
    },
    busia: {
        constituencies: ["Teso North", "Teso South", "Nambale", "Matayos", "Butula", "Funyula", "Budalangi"],
        chiefs: {
            "Teso North": ["Malaba Chief's Office", "Ang'urai South Chief's Office", "Ang'urai North Chief's Office", "Malaba Central Chief's Office"],
            "Teso South": ["Ang'orom Chief's Office", "Chakol South Chief's Office", "Chakol North Chief's Office", "Amukura East Chief's Office"],
            "Nambale": ["Nambale Chief's Office", "Bukhayo North Chief's Office", "Bukhayo East Chief's Office", "Bukhayo Central Chief's Office"],
            "Matayos": ["Matayos Chief's Office", "Busibwabo Chief's Office", "Mayenje Chief's Office", "Burumba Chief's Office"],
            "Butula": ["Butula Chief's Office", "Marachi East Chief's Office", "Marachi West Chief's Office", "Marachi Central Chief's Office"],
            "Funyula": ["Funyula Chief's Office", "Namboboto Nambuku Chief's Office", "Ageng'a Nanguba Chief's Office"],
            "Budalangi": ["Budalangi Chief's Office", "Bunyala North Chief's Office", "Bunyala South Chief's Office", "Bunyala Central Chief's Office"]
        }
    },
    vihiga: {
        constituencies: ["Vihiga", "Sabatia", "Hamisi", "Luanda", "Emuhaya"],
        chiefs: {
            "Vihiga": ["Vihiga Chief's Office", "Lugaga-Wamuluma Chief's Office", "South Maragoli Chief's Office", "Central Maragoli Chief's Office"],
            "Sabatia": ["Sabatia Chief's Office", "North Maragoli Chief's Office", "Wodanga Chief's Office", "Chavakali Chief's Office"],
            "Hamisi": ["Hamisi Chief's Office", "Shiru Chief's Office", "Muhudu Chief's Office", "Gisambai Chief's Office"],
            "Luanda": ["Luanda Chief's Office", "Wemilabi Chief's Office", "Mwibona Chief's Office", "Emabungo Chief's Office"],
            "Emuhaya": ["Emuhaya Chief's Office", "Bunyore West Chief's Office", "Bunyore East Chief's Office", "Bunyore Central Chief's Office"]
        }
    },
    siaya: {
        constituencies: ["Rarieda", "Bondo", "Gem", "Ugenya", "Ugunja", "Alego Usonga"],
        chiefs: {
            "Rarieda": ["Rarieda Chief's Office", "West Asembo Chief's Office", "North Uyoma Chief's Office", "South Uyoma Chief's Office"],
            "Bondo": ["Bondo Chief's Office", "West Yimbo Chief's Office", "Central Sakwa Chief's Office", "South Sakwa Chief's Office"],
            "Gem": ["Gem Chief's Office", "North Gem Chief's Office", "East Gem Chief's Office", "Yala Township Chief's Office"],
            "Ugenya": ["Ugenya Chief's Office", "East Asembo Chief's Office", "West Ugenya Chief's Office", "Ukwala Chief's Office"],
            "Ugunja": ["Ugunja Chief's Office", "Sidindi Chief's Office", "Sigomere Chief's Office", "Ugunja Township Chief's Office"],
            "Alego Usonga": ["Alego Chief's Office", "Usonga Chief's Office", "West Alego Chief's Office", "Central Alego Chief's Office"]
        }
    },
    homa_bay: {
        constituencies: ["Kasipul", "Kabondo Kasipul", "Karachuonyo", "Rangwe", "Homa Bay Town", "Ndhiwa", "Suba North", "Suba South"],
        chiefs: {
            "Kasipul": ["Kasipul Chief's Office", "West Kasipul Chief's Office", "Central Kasipul Chief's Office", "East Kamagak Chief's Office"],
            "Kabondo Kasipul": ["Kabondo East Chief's Office", "Kabondo West Chief's Office", "Kokwanyo/Kakelo Chief's Office"],
            "Karachuonyo": ["Karachuonyo Chief's Office", "North Karachuonyo Chief's Office", "Central Karachuonyo Chief's Office", "Wangchieng Chief's Office"],
            "Rangwe": ["Rangwe Chief's Office", "West Gem Chief's Office", "East Gem Chief's Office", "Kochia Chief's Office"],
            "Homa Bay Town": ["Homa Bay Central Chief's Office", "Homa Bay Arujo Chief's Office", "Homa Bay West Chief's Office", "Homa Bay East Chief's Office"],
            "Ndhiwa": ["Ndhiwa Chief's Office", "Kwabwai Chief's Office", "Kanyadoto Chief's Office", "Kanyikela Chief's Office"],
            "Suba North": ["Mfangano Island Chief's Office", "Rusinga Island Chief's Office", "Kasgunga Chief's Office", "Lambwe Chief's Office"],
            "Suba South": ["Gwassi South Chief's Office", "Gwassi North Chief's Office", "Kaksingri West Chief's Office", "Ruma-Kaksingri East Chief's Office"]
        }
    },
    migori: {
        constituencies: ["Rongo", "Awendo", "Suna East", "Suna West", "Uriri", "Nyatike", "Kuria West", "Kuria East"],
        chiefs: {
            "Rongo": ["Rongo Chief's Office", "North Kamagambo Chief's Office", "Central Kamagambo Chief's Office", "East Kamagambo Chief's Office"],
            "Awendo": ["Awendo Chief's Office", "North Sakwa Chief's Office", "South Sakwa Chief's Office", "West Sakwa Chief's Office"],
            "Suna East": ["Suna East Chief's Office", "God Jope Chief's Office", "Suna Central Chief's Office", "Kakrao Chief's Office"],
            "Suna West": ["Suna West Chief's Office", "Wiga Chief's Office", "Wasweta II Chief's Office", "Ragana-Oruba Chief's Office"],
            "Uriri": ["Uriri Chief's Office", "North Kanyamkago Chief's Office", "Central Kanyamkago Chief's Office", "South Kanyamkago Chief's Office"],
            "Nyatike": ["Nyatike Chief's Office", "Karungu Chief's Office", "Kaler Chief's Office", "Got Kachola Chief's Office"],
            "Kuria West": ["Bukira East Chief's Office", "Bukira Central/Ikerege Chief's Office", "Isibania Chief's Office"],
            "Kuria East": ["Gokeharaka/Getambwega Chief's Office", "Ntimaru West Chief's Office", "Ntimaru East Chief's Office", "Nyabasi East Chief's Office"]
        }
    },
    nyeri: {
        constituencies: ["Tetu", "Kieni", "Mathira", "Othaya", "Mukurweini", "Nyeri Town"],
        chiefs: {
            "Tetu": ["Tetu Chief's Office", "Aguthi-Gaaki Chief's Office", "Dedan Kimathi Chief's Office"],
            "Kieni": ["Kieni East Chief's Office", "Kieni West Chief's Office", "Naromoru/Kiamathaga Chief's Office", "Gatarakwa Chief's Office"],
            "Mathira": ["Mathira Chief's Office", "Karatina Town Chief's Office", "Konyu Chief's Office", "Iriaini Chief's Office"],
            "Othaya": ["Othaya Chief's Office", "Karima Chief's Office", "Mahiga Chief's Office", "Chinga Chief's Office"],
            "Mukurweini": ["Mukurweini Chief's Office", "Rugi Chief's Office", "Gikondi Chief's Office"],
            "Nyeri Town": ["Nyeri Town Chief's Office", "Kamakwa/Mukaro Chief's Office", "Rware Chief's Office", "Ruring'u Chief's Office"]
        }
    },
    kirinyaga: {
        constituencies: ["Mwea", "Gichugu", "Ndia", "Kirinyaga Central"],
        chiefs: {
            "Mwea": ["Mwea Chief's Office", "Wamumu Chief's Office", "Nyangati Chief's Office", "Murinduko Chief's Office"],
            "Gichugu": ["Gichugu Chief's Office", "Baragwi Chief's Office", "Njukiini Chief's Office", "Kabare Chief's Office"],
            "Ndia": ["Ndia Chief's Office", "Mukure Chief's Office", "Kiine Chief's Office", "Kariti Chief's Office"],
            "Kirinyaga Central": ["Kerugoya/Kutus Chief's Office", "Inoi Chief's Office", "Mutira Chief's Office"]
        }
    },
    murang_a: {
        constituencies: ["Kangema", "Mathioya", "Kiharu", "Kigumo", "Maragwa", "Kandara", "Gatanga"],
        chiefs: {
            "Kangema": ["Kangema Chief's Office", "Rwathia Chief's Office", "Kanyenya-ini Chief's Office"],
            "Mathioya": ["Mathioya Chief's Office", "Kiru Chief's Office", "Kamacharia Chief's Office"],
            "Kiharu": ["Kiharu Chief's Office", "Ndakaini Chief's Office", "Township Chief's Office", "Muriranjas Chief's Office"],
            "Kigumo": ["Kigumo Chief's Office", "Maragua Ridge Chief's Office", "Kangari Chief's Office"],
            "Maragwa": ["Maragwa Chief's Office", "Kamahuha Chief's Office", "Ichagaki Chief's Office", "Nginda Chief's Office"],
            "Kandara": ["Kandara Chief's Office", "Ng'araria Chief's Office", "Gaichanjiru Chief's Office", "Ithiru Chief's Office"],
            "Gatanga": ["Gatanga Chief's Office", "Kariara Chief's Office", "Mukarara Chief's Office", "Kakuzi/Mitubiri Chief's Office"]
        }
    },
    nyandarua: {
        constituencies: ["Kinangop", "Kipipiri", "Ol Kalou", "Ol Jorok", "Ndaragwa"],
        chiefs: {
            "Kinangop": ["Kinangop Chief's Office", "Magumu Chief's Office", "Githabai Chief's Office"],
            "Kipipiri": ["Kipipiri Chief's Office", "Wanjohi Chief's Office", "Geta Chief's Office"],
            "Ol Kalou": ["Ol Kalou Chief's Office", "Kaimbaga Chief's Office", "Rurii Chief's Office"],
            "Ol Jorok": ["Ol Jorok Chief's Office", "Karau Chief's Office", "Mirangine Chief's Office"],
            "Ndaragwa": ["Ndaragwa Chief's Office", "Shamata Chief's Office", "Leshau Pondo Chief's Office"]
        }
    },
    nyamira: {
        constituencies: ["Kitutu Masaba", "West Mugirango", "North Mugirango", "Borabu"],
        chiefs: {
            "Kitutu Masaba": ["Kitutu Masaba Chief's Office", "Kemera Chief's Office", "Magombo Chief's Office", "Gesugure Chief's Office"],
            "West Mugirango": ["West Mugirango Chief's Office", "Bonyamatuta Chief's Office", "Tabaka Chief's Office", "Bogichora Chief's Office"],
            "North Mugirango": ["North Mugirango Chief's Office", "Itibo Chief's Office", "Bomwagamo Chief's Office", "Township Chief's Office"],
            "Borabu": ["Borabu Chief's Office", "Mekenene Chief's Office", "Nyansiongo Chief's Office", "Esise Chief's Office"]
        }
    },
    kisii: {
        constituencies: ["Bomachoge Borabu", "Bomachoge Chache", "Nyaribari Masaba", "Nyaribari Chache", "Kitutu Chache North", "Kitutu Chache South", "Bonchari", "South Mugirango", "Bobasi"],
        chiefs: {
            "Bomachoge Borabu": ["Bomachoge Borabu Chief's Office", "Bomariba Chief's Office", "Bosoti/Sengera Chief's Office"],
            "Bomachoge Chache": ["Bomachoge Chache Chief's Office", "Majoge Basi Chief's Office", "Boochi/Tendere Chief's Office"],
            "Nyaribari Masaba": ["Nyaribari Masaba Chief's Office", "Ichuni Chief's Office", "Nyamaiya Chief's Office", "Masimba Chief's Office"],
            "Nyaribari Chache": ["Nyaribari Chache Chief's Office", "Bogiakumu Chief's Office", "Bobaracho Chief's Office", "Kisii Central Chief's Office"],
            "Kitutu Chache North": ["Kitutu Chache North Chief's Office", "Monyerero Chief's Office", "Sensi Chief's Office", "Marani Chief's Office"],
            "Kitutu Chache South": ["Kitutu Chache South Chief's Office", "Bogusero Chief's Office", "Bogeka Chief's Office", "Nyakoe Chief's Office"],
            "Bonchari": ["Bonchari Chief's Office", "Bogiakumu Chief's Office", "Riana Chief's Office", "Tabaka Chief's Office"],
            "South Mugirango": ["South Mugirango Chief's Office", "Tabaka Chief's Office", "Boikanga Chief's Office", "Bogusero Chief's Office"],
            "Bobasi": ["Bobasi Chief's Office", "Masaba Chief's Office", "Nyacheki Chief's Office", "Sameta/Mokwerero Chief's Office"]
        }
    },
    bomet: {
        constituencies: ["Sotik", "Chepalungu", "Bomet East", "Bomet Central", "Konoin"],
        chiefs: {
            "Sotik": ["Sotik Chief's Office", "Kapletundo Chief's Office", "Rongena/Manaret Chief's Office", "Kipsonoi Chief's Office"],
            "Chepalungu": ["Chepalungu Chief's Office", "Kong'asis Chief's Office", "Nyongores Chief's Office", "Sigor Chief's Office"],
            "Bomet East": ["Bomet East Chief's Office", "Mutarakwa Chief's Office", "Longisa Chief's Office", "Kipreres Chief's Office"],
            "Bomet Central": ["Bomet Central Chief's Office", "Silibwet Township Chief's Office", "Singorwet Chief's Office", "Chesoen Chief's Office"],
            "Konoin": ["Konoin Chief's Office", "Embomos Chief's Office", "Chepchabas Chief's Office", "Kimulot Chief's Office"]
        }
    },
    kericho: {
        constituencies: ["Kipkelion East", "Kipkelion West", "Ainamoi", "Bureti", "Belgut", "Sigowet/Soin"],
        chiefs: {
            "Kipkelion East": ["Kipkelion East Chief's Office", "Kedowa/Kimugul Chief's Office", "Londiani Chief's Office", "Chepseon Chief's Office"],
            "Kipkelion West": ["Kipkelion West Chief's Office", "Kunyak Chief's Office", "Kamasian Chief's Office", "Chilchila Chief's Office"],
            "Ainamoi": ["Ainamoi Chief's Office", "Kapkugerwet Chief's Office", "Kapsoit Chief's Office", "Ainamoi Township Chief's Office"],
            "Bureti": ["Bureti Chief's Office", "Tebesonik Chief's Office", "Chemosot Chief's Office", "Kisiara Chief's Office"],
            "Belgut": ["Belgut Chief's Office", "Waldai Chief's Office", "Kabianga Chief's Office", "Cheboin Chief's Office"],
            "Sigowet/Soin": ["Sigowet Chief's Office", "Soin Chief's Office", "Soliat Chief's Office", "Kapkatet Chief's Office"]
        }
    },
    nandi: {
        constituencies: ["Mosop", "Emgwen", "Aldai", "Nandi Hills", "Chesumei", "Tinderet"],
        chiefs: {
            "Mosop": ["Mosop Chief's Office", "Kapkangani Chief's Office", "Kapsisiywa Chief's Office", "Sangalo/Kemeloi Chief's Office"],
            "Emgwen": ["Emgwen Chief's Office", "Kapsabet Chief's Office", "Chepkongony Chief's Office", "Kaptumo/Kaboi Chief's Office"],
            "Aldai": ["Aldai Chief's Office", "Kobujoi Chief's Office", "Kemeloi/Maraba Chief's Office", "Kabisaga Chief's Office"],
            "Nandi Hills": ["Nandi Hills Chief's Office", "Ol'lessos Chief's Office", "Kapchorua Chief's Office", "Chepkunyuk Chief's Office"],
            "Chesumei": ["Chesumei Chief's Office", "Kaptel/Kamoiywo Chief's Office", "Chemundu/Kapng'etuny Chief's Office", "Litein Chief's Office"],
            "Tinderet": ["Tinderet Chief's Office", "Songhor/Soba Chief's Office", "Chemelil/Chemase Chief's Office", "Kapsimotwo Chief's Office"]
        }
    },
    baringo: {
        constituencies: ["Baringo North", "Baringo Central", "Baringo South", "Mogotio", "Eldama Ravine", "Tiaty"],
        chiefs: {
            "Baringo North": ["Baringo North Chief's Office", "Saimo/Soi Chief's Office", "Saimo/Kipsaraman Chief's Office", "Bartabwa Chief's Office"],
            "Baringo Central": ["Baringo Central Chief's Office", "Kabarnet Chief's Office", "Sacho Chief's Office", "Tenges Chief's Office"],
            "Baringo South": ["Baringo South Chief's Office", "Marigat Chief's Office", "Ilchamus Chief's Office", "Mochongoi Chief's Office"],
            "Mogotio": ["Mogotio Chief's Office", "Emining Chief's Office", "Kisanana Chief's Office"],
            "Eldama Ravine": ["Eldama Ravine Chief's Office", "Lembus Chief's Office", "Lembus Kwen Chief's Office", "Koibatek Chief's Office"],
            "Tiaty": ["Tiaty Chief's Office", "Kolowa Chief's Office", "Ribkwo Chief's Office", "Silale Chief's Office"]
        }
    },
    laikipia: {
        constituencies: ["Laikipia West", "Laikipia East", "Laikipia North"],
        chiefs: {
            "Laikipia West": ["Laikipia West Chief's Office", "Nyahururu Chief's Office", "Mukogodo West Chief's Office", "Githiga Chief's Office"],
            "Laikipia East": ["Laikipia East Chief's Office", "Nanyuki Chief's Office", "Tigithi Chief's Office", "Thingithu Chief's Office"],
            "Laikipia North": ["Laikipia North Chief's Office", "Mukogodo East Chief's Office", "Sosian Chief's Office", "Segera Chief's Office"]
        }
    },
    samburu: {
        constituencies: ["Samburu West", "Samburu North", "Samburu East"],
        chiefs: {
            "Samburu West": ["Samburu West Chief's Office", "Lodokejek Chief's Office", "Suguta Marmar Chief's Office", "Maralal Chief's Office"],
            "Samburu North": ["Samburu North Chief's Office", "El-Barta Chief's Office", "Nachola Chief's Office", "Ndoto Chief's Office"],
            "Samburu East": ["Samburu East Chief's Office", "Waso Chief's Office", "Wamba West Chief's Office", "Wamba East Chief's Office"]
        }
    },
    isiolo: {
        constituencies: ["Isiolo North", "Isiolo South"],
        chiefs: {
            "Isiolo North": ["Isiolo North Chief's Office", "Bulla Pesa Chief's Office", "Cherab Chief's Office", "Oldonyiro Chief's Office"],
            "Isiolo South": ["Isiolo South Chief's Office", "Kinna Chief's Office", "Garba Tulla Chief's Office", "Sericho Chief's Office"]
        }
    },
    meru: {
        constituencies: ["Igembe South", "Igembe Central", "Igembe North", "Tigania West", "Tigania East", "North Imenti", "Buuri", "Central Imenti", "South Imenti"],
        chiefs: {
            "Igembe South": ["Igembe South Chief's Office", "Kangeta Chief's Office", "Athwana Chief's Office", "Akithi Chief's Office"],
            "Igembe Central": ["Igembe Central Chief's Office", "Aantubetwe Kiongo Chief's Office", "Athiru Ruujine Chief's Office", "Maua Chief's Office"],
            "Igembe North": ["Igembe North Chief's Office", "Antuambui Chief's Office", "Antubochiu Chief's Office", "Ntunene Chief's Office"],
            "Tigania West": ["Tigania West Chief's Office", "Kianjai Chief's Office", "Nkomo Chief's Office", "Uringu Chief's Office"],
            "Tigania East": ["Tigania East Chief's Office", "Mikinduri Chief's Office", "Thangatha Chief's Office", "Muthara Chief's Office"],
            "North Imenti": ["North Imenti Chief's Office", "Nyaki West Chief's Office", "Nyaki East Chief's Office", "Meru Central Chief's Office"],
            "Buuri": ["Buuri Chief's Office", "Kisima Chief's Office", "Timau Chief's Office", "Ruiri Chief's Office"],
            "Central Imenti": ["Central Imenti Chief's Office", "Abothuguchi West Chief's Office", "Abothuguchi Central Chief's Office", "Kibirichia Chief's Office"],
            "South Imenti": ["South Imenti Chief's Office", "Igoji East Chief's Office", "Igoji West Chief's Office", "Nkuene Chief's Office"]
        }
    },
    tharaka_nithi: {
        constituencies: ["Tharaka", "Chuka/Igambang'ombe", "Maara"],
        chiefs: {
            "Tharaka": ["Tharaka Chief's Office", "Nkondi Chief's Office", "Mukothima Chief's Office", "Marimanti Chief's Office"],
            "Chuka/Igambang'ombe": ["Chuka Chief's Office", "Igambang'ombe Chief's Office", "Mugwe Chief's Office", "Gachuru Chief's Office"],
            "Maara": ["Maara Chief's Office", "Mwimbi Chief's Office", "Muthambi Chief's Office", "Chogoria Chief's Office"]
        }
    },
    embu: {
        constituencies: ["Manyatta", "Runyenjes", "Mbeere South", "Mbeere North"],
        chiefs: {
            "Manyatta": ["Manyatta Chief's Office", "Kithimu Chief's Office", "Mbeti South Chief's Office", "Evurore Chief's Office"],
            "Runyenjes": ["Runyenjes Chief's Office", "Gaturi South Chief's Office", "Kagaari South Chief's Office", "Central Chief's Office"],
            "Mbeere South": ["Mbeere South Chief's Office", "Kiambere Chief's Office", "Mbeti North Chief's Office", "Mavuria Chief's Office"],
            "Mbeere North": ["Mbeere North Chief's Office", "Evurore Chief's Office", "Nthawa Chief's Office", "Siakago Chief's Office"]
        }
    },
    kitui: {
        constituencies: ["Kitui West", "Kitui Rural", "Kitui Central", "Kitui East", "Kitui South", "Mwingi North", "Mwingi West", "Mwingi Central"],
        chiefs: {
            "Kitui West": ["Kitui West Chief's Office", "Kauwi Chief's Office", "Matinyani Chief's Office", "Kwa Vonza Chief's Office"],
            "Kitui Rural": ["Kitui Rural Chief's Office", "Kisasi Chief's Office", "Mutha Chief's Office", "Ikanga/Kyatune Chief's Office"],
            "Kitui Central": ["Kitui Central Chief's Office", "Township Chief's Office", "Kyangwithya West Chief's Office", "Kyangwithya East Chief's Office"],
            "Kitui East": ["Kitui East Chief's Office", "Voo/Kyamatu Chief's Office", "Nzambani Chief's Office", "Endau/Malalani Chief's Office"],
            "Kitui South": ["Kitui South Chief's Office", "Ikutha Chief's Office", "Mutomo Chief's Office", "Mutha Chief's Office"],
            "Mwingi North": ["Mwingi North Chief's Office", "Ngomeni Chief's Office", "Kyuso Chief's Office", "Mumoni Chief's Office"],
            "Mwingi West": ["Mwingi West Chief's Office", "Kyome/Thaana Chief's Office", "Migwani Chief's Office", "Kiomo/Kyethani Chief's Office"],
            "Mwingi Central": ["Mwingi Central Chief's Office", "Waita Chief's Office", "Wikithuki Chief's Office", "Tseikuru Chief's Office"]
        }
    },
    machakos: {
        constituencies: ["Machakos Town", "Mavoko", "Masinga", "Yatta", "Kangundo", "Matungulu", "Kathiani", "Mwala"],
        chiefs: {
            "Machakos Town": ["Machakos Central Chief's Office", "Mumbuni North Chief's Office", "Mumbuni South Chief's Office", "Mutituni Chief's Office"],
            "Mavoko": ["Mavoko Chief's Office", "Athi River Chief's Office", "Kinanie Chief's Office", "Muthwani Chief's Office"],
            "Masinga": ["Masinga Central Chief's Office", "Ekalakala Chief's Office", "Muthesya Chief's Office", "Kivaa Chief's Office"],
            "Yatta": ["Yatta Chief's Office", "Kola Chief's Office", "Matuu Chief's Office", "Ikombe Chief's Office"],
            "Kangundo": ["Kangundo East Chief's Office", "Kangundo West Chief's Office", "Kangundo Central Chief's Office", "Kangundo North Chief's Office"],
            "Matungulu": ["Matungulu East Chief's Office", "Matungulu West Chief's Office", "Kyeleni Chief's Office", "Tala Chief's Office"],
            "Kathiani": ["Kathiani Chief's Office", "Mitaboni Chief's Office", "Upper Kaewa Chief's Office", "Lower Kaewa Chief's Office"],
            "Mwala": ["Mwala Chief's Office", "Mbiuni Chief's Office", "Wamunyu Chief's Office", "Kibauni Chief's Office"]
        }
    },
    makueni: {
        constituencies: ["Makueni", "Kaiti", "Kibwezi West", "Kibwezi East", "Kilome", "Mbooni"],
        chiefs: {
            "Makueni": ["Makueni Chief's Office", "Wote Chief's Office", "Kathonzweni Chief's Office", "Mavindini Chief's Office"],
            "Kaiti": ["Kaiti Chief's Office", "Kee Chief's Office", "Ukia Chief's Office", "Kilungu Chief's Office"],
            "Kibwezi West": ["Kibwezi West Chief's Office", "Kambu Chief's Office", "Makindu Chief's Office", "Nguumo Chief's Office"],
            "Kibwezi East": ["Kibwezi East Chief's Office", "Mtito Andei Chief's Office", "Thange Chief's Office", "Ivingoni Chief's Office"],
            "Kilome": ["Kilome Chief's Office", "Kasikeu Chief's Office", "Mukaa Chief's Office", "Kiima Kiu/Kalama Chief's Office"],
            "Mbooni": ["Mbooni Chief's Office", "Tulimani Chief's Office", "Kalawa Chief's Office", "Kithungo/Kitundu Chief's Office"]
        }
    },
    taita_taveta: {
        constituencies: ["Taveta", "Wundanyi", "Mwatate", "Voi"],
        chiefs: {
            "Taveta": ["Taveta Chief's Office", "Bomeni Chief's Office", "Chala Chief's Office"],
            "Wundanyi": ["Wundanyi Chief's Office", "Wusi/Kishushe Chief's Office", "Mghange Chief's Office"],
            "Mwatate": ["Mwatate Chief's Office", "Bura Chief's Office", "Chawia Chief's Office"],
            "Voi": ["Voi Chief's Office", "Sagalla Chief's Office", "Mbololo Chief's Office", "Kaloleni Chief's Office"]
        }
    },
    kwale: {
        constituencies: ["Msambweni", "Lungalunga", "Matuga", "Kinango"],
        chiefs: {
            "Msambweni": ["Msambweni Chief's Office", "Ramisi Chief's Office", "Kinondo Chief's Office"],
            "Lungalunga": ["Lungalunga Chief's Office", "Vanga Chief's Office", "Pongwe/Kikoneni Chief's Office"],
            "Matuga": ["Matuga Chief's Office", "Tsimba Golini Chief's Office", "Kubo South Chief's Office", "Mkongani Chief's Office"],
            "Kinango": ["Kinango Chief's Office", "Chengoni/Samburu Chief's Office", "Mackinnon Road Chief's Office", "Kasemeni Chief's Office"]
        }
    },
    kilifi: {
        constituencies: ["Kilifi North", "Kilifi South", "Kaloleni", "Rabai", "Ganze", "Malindi", "Magarini"],
        chiefs: {
            "Kilifi North": ["Kilifi North Chief's Office", "Tezo Chief's Office", "Sokoke Chief's Office", "Matsangoni Chief's Office"],
            "Kilifi South": ["Kilifi South Chief's Office", "Junju Chief's Office", "Mtwapa Chief's Office", "Shimo La Tewa Chief's Office"],
            "Kaloleni": ["Kaloleni Chief's Office", "Mariakani Chief's Office", "Jibana Chief's Office", "Kayafungo Chief's Office"],
            "Rabai": ["Rabai Chief's Office", "Ruruma Chief's Office", "Kambe/Ribe Chief's Office", "Mwawesa Chief's Office"],
            "Ganze": ["Ganze Chief's Office", "Bamba Chief's Office", "Jaribuni Chief's Office", "Ganze Chief's Office"],
            "Malindi": ["Malindi Chief's Office", "Malindi Town Chief's Office", "Jilore Chief's Office", "Kakuyuni Chief's Office"],
            "Magarini": ["Magarini Chief's Office", "Marafa Chief's Office", "Gongoni Chief's Office", "Adu Chief's Office"]
        }
    },
    tana_river: {
        constituencies: ["Garsen", "Galole", "Bura"],
        chiefs: {
            "Garsen": ["Garsen Chief's Office", "Kipini Chief's Office", "Garsen South Chief's Office", "Garsen Central Chief's Office"],
            "Galole": ["Galole Chief's Office", "Wayu Chief's Office", "Chewani Chief's Office", "Mikinduni Chief's Office"],
            "Bura": ["Bura Chief's Office", "Bangale Chief's Office", "Madogo Chief's Office", "Sala Chief's Office"]
        }
    },
    lamu: {
        constituencies: ["Lamu East", "Lamu West"],
        chiefs: {
            "Lamu East": ["Lamu East Chief's Office", "Faza Chief's Office", "Kiunga Chief's Office", "Basuba Chief's Office"],
            "Lamu West": ["Lamu West Chief's Office", "Witu Chief's Office", "Hongwe Chief's Office", "Bahari Chief's Office"]
        }
    },
    garissa: {
        constituencies: ["Garissa Township", "Balambala", "Lagdera", "Dadaab", "Fafi", "Ijara"],
        chiefs: {
            "Garissa Township": ["Garissa Township Chief's Office", "Galbet Chief's Office", "Iftin Chief's Office", "Township Chief's Office"],
            "Balambala": ["Balambala Chief's Office", "Saka Chief's Office", "Sankuri Chief's Office", "Balambala Central Chief's Office"],
            "Lagdera": ["Lagdera Chief's Office", "Benane Chief's Office", "Goreale Chief's Office", "Maalimin Chief's Office"],
            "Dadaab": ["Dadaab Chief's Office", "Dertu Chief's Office", "Liboi Chief's Office", "Abakaile Chief's Office"],
            "Fafi": ["Fafi Chief's Office", "Nanighi Chief's Office", "Jarajilla Chief's Office", "Hulugho Chief's Office"],
            "Ijara": ["Ijara Chief's Office", "Sangailu Chief's Office", "Masalani Chief's Office", "Hulugho Chief's Office"]
        }
    },
    wajir: {
        constituencies: ["Wajir North", "Wajir East", "Tarbaj", "Wajir West", "Eldas", "Wajir South"],
        chiefs: {
            "Wajir North": ["Wajir North Chief's Office", "Buna Chief's Office", "Kotulo Chief's Office", "Danaba Chief's Office"],
            "Wajir East": ["Wajir East Chief's Office", "Barwaqo Chief's Office", "Khorof/Harar Chief's Office", "Wagberi Chief's Office"],
            "Tarbaj": ["Tarbaj Chief's Office", "Wajir Bor Chief's Office", "Sarman Chief's Office", "Elben Chief's Office"],
            "Wajir West": ["Wajir West Chief's Office", "Hadado/Athibohol Chief's Office", "Ademasajide Chief's Office", "Ganyure/Wagalla Chief's Office"],
            "Eldas": ["Eldas Chief's Office", "Della Chief's Office", "Lakoley South/Basir Chief's Office", "Ibrahim Ure Chief's Office"],
            "Wajir South": ["Wajir South Chief's Office", "Diif Chief's Office", "Benane Chief's Office", "Habasweine Chief's Office"]
        }
    },
    mandera: {
        constituencies: ["Mandera West", "Banissa", "Mandera North", "Mandera South", "Mandera East", "Lafey"],
        chiefs: {
            "Mandera West": ["Mandera West Chief's Office", "Takaba Chief's Office", "Gither Chief's Office", "Dandu Chief's Office"],
            "Banissa": ["Banissa Chief's Office", "Kiliwehiri Chief's Office", "Fino Chief's Office", "Derkhale Chief's Office"],
            "Mandera North": ["Mandera North Chief's Office", "Lafey Chief's Office", "Kutulo Chief's Office", "Ashabito Chief's Office"],
            "Mandera South": ["Mandera South Chief's Office", "Shimbir Fatuma Chief's Office", "Township Chief's Office", "Libehia Chief's Office"],
            "Mandera East": ["Mandera East Chief's Office", "Rhamu Chief's Office", "Rhamu Dimtu Chief's Office", "Warankara Chief's Office"],
            "Lafey": ["Lafey Chief's Office", "Wayu Chief's Office", "Alungo Gof Chief's Office", "Fino Chief's Office"]
        }
    },
    marsabit: {
        constituencies: ["Moyale", "North Horr", "Saku", "Laisamis"],
        chiefs: {
            "Moyale": ["Moyale Chief's Office", "Sololo Chief's Office", "Golbo Chief's Office", "Butiye Chief's Office"],
            "North Horr": ["North Horr Chief's Office", "Dukana Chief's Office", "Maikona Chief's Office", "Turbi Chief's Office"],
            "Saku": ["Saku Chief's Office", "Marsabit Central Chief's Office", "Sagante/Jaldesa Chief's Office", "Kargi/South Horr Chief's Office"],
            "Laisamis": ["Laisamis Chief's Office", "Korr/Ngurunit Chief's Office", "Logologo Chief's Office", "Laisamis Central Chief's Office"]
        }
    },
    turkana: {
        constituencies: ["Turkana North", "Turkana West", "Turkana Central", "Loima", "Turkana South", "Turkana East"],
        chiefs: {
            "Turkana North": ["Turkana North Chief's Office", "Kibish Chief's Office", "Lapur Chief's Office", "Kaaleng Chief's Office"],
            "Turkana West": ["Turkana West Chief's Office", "Kakuma Chief's Office", "Songot Chief's Office", "Kalobeyei Chief's Office"],
            "Turkana Central": ["Turkana Central Chief's Office", "Kerio Delta Chief's Office", "Lodwar Township Chief's Office", "Kanamkemer Chief's Office"],
            "Loima": ["Loima Chief's Office", "Kotaruk/Lobei Chief's Office", "Turkwel Chief's Office", "Loima Central Chief's Office"],
            "Turkana South": ["Turkana South Chief's Office", "Kaputir Chief's Office", "Katilu Chief's Office", "Lobokat Chief's Office"],
            "Turkana East": ["Turkana East Chief's Office", "Kapedo/Napeitom Chief's Office", "Lorengelup Chief's Office", "Lokori/Kochodin Chief's Office"]
        }
    },
    west_pokot: {
        constituencies: ["Kacheliba", "Kapenguria", "Sigor", "West Pokot"],
        chiefs: {
            "Kacheliba": ["Kacheliba Chief's Office", "Kasei Chief's Office", "Kapchich Chief's Office", "Kiwawa Chief's Office"],
            "Kapenguria": ["Kapenguria Chief's Office", "Riwo Chief's Office", "Kapenguria Township Chief's Office", "Siyoi Chief's Office"],
            "Sigor": ["Sigor Chief's Office", "Sekerr Chief's Office", "Masool Chief's Office", "Lomut Chief's Office"],
            "West Pokot": ["Mnagei Chief's Office", "Lelan Chief's Office", "Batei Chief's Office", "Tapach Chief's Office"]
        }
    },
    trans_mara: {
        constituencies: ["Kilgoris", "Kuria East"],
        chiefs: {
            "Kilgoris": ["Kilgoris Chief's Office", "Keyian Chief's Office", "Shankoe Chief's Office", "Kimintet Chief's Office"],
            "Kuria East": ["Ntimaru East Chief's Office", "Ntimaru West Chief's Office", "Nyabasi East Chief's Office", "Nyabasi West Chief's Office"]
        }
    },
    narok: {
        constituencies: ["Kajiado North", "Kajiado Central", "Kajiado East", "Kajiado West", "Kajiado South"],
        chiefs: {
            "Kajiado North": ["Kajiado North Chief's Office", "Olkeri Chief's Office", "Nkaimurunya Chief's Office", "Oloolua Chief's Office"],
            "Kajiado Central": ["Kajiado Central Chief's Office", "Purko Chief's Office", "Matapato North Chief's Office", "Matapato South Chief's Office"],
            "Kajiado East": ["Kajiado East Chief's Office", "Kitengela Chief's Office", "Oloosirkon/Sholinke Chief's Office", "Kenyawa-Poka Chief's Office"],
            "Kajiado West": ["Kajiado West Chief's Office", "Keekonyokie Chief's Office", "Iloodokilani Chief's Office", "Magadi Chief's Office"],
            "Kajiado South": ["Kajiado South Chief's Office", "Loodokilani Chief's Office", "Kuku Chief's Office", "Rombo Chief's Office"]
        }
    },
    kajiado: {
        constituencies: ["Kajiado North", "Kajiado Central", "Kajiado East", "Kajiado West", "Kajiado South"],
        chiefs: {
            "Kajiado North": ["Kajiado North Chief's Office", "Olkeri Chief's Office", "Nkaimurunya Chief's Office", "Oloolua Chief's Office"],
            "Kajiado Central": ["Kajiado Central Chief's Office", "Purko Chief's Office", "Matapato North Chief's Office", "Matapato South Chief's Office"],
            "Kajiado East": ["Kajiado East Chief's Office", "Kitengela Chief's Office", "Oloosirkon/Sholinke Chief's Office", "Kenyawa-Poka Chief's Office"],
            "Kajiado West": ["Kajiado West Chief's Office", "Keekonyokie Chief's Office", "Iloodokilani Chief's Office", "Magadi Chief's Office"],
            "Kajiado South": ["Kajiado South Chief's Office", "Loodokilani Chief's Office", "Kuku Chief's Office", "Rombo Chief's Office"]
        }
    },

    pokot: {
    constituencies: ["Kapenguria", "Sigor", "Kacheliba", "Pokot South"],
    chiefs: {
        "Kapenguria": ["Kapenguria Chief's Office", "Riwo Chief's Office", "Kapchok Chief's Office", "Siyoi Chief's Office"],
        "Sigor": ["Sigor Chief's Office", "Sekerr Chief's Office", "Masool Chief's Office", "Lomut Chief's Office"],
        "Kacheliba": ["Kacheliba Chief's Office", "Kasei Chief's Office", "Kapchebau Chief's Office", "Suam Chief's Office"],
        "Pokot South": ["Pokot South Chief's Office", "Tapach Chief's Office", "Weiwei Chief's Office", "Batei Chief's Office"]
    }
},
uasin_gishu: {
    constituencies: ["Eldoret East", "Eldoret West", "Eldoret South", "Kapseret", "Kesses", "Moiben"],
    chiefs: {
        "Eldoret East": ["Eldoret East Chief's Office", "Langas Chief's Office", "Kamukunji Chief's Office"],
        "Eldoret West": ["Eldoret West Chief's Office", "Kapsoya Chief's Office", "Pioneer Chief's Office"],
        "Eldoret South": ["Eldoret South Chief's Office", "Kapsaos Chief's Office", "Ainabkoi Chief's Office"],
        "Kapseret": ["Kapseret Chief's Office", "Simat/Kapseret Chief's Office", "Ngenyilel Chief's Office"],
        "Kesses": ["Kesses Chief's Office", "Racecourse Chief's Office", "Cheptiret/Kipchamo Chief's Office"],
        "Moiben": ["Moiben Chief's Office", "Kaptagat Chief's Office", "Tembelio Chief's Office"]
    }
},
trans_nzoia: {
    constituencies: ["Kwanza", "Endebess", "Saboti", "Kiminini", "Cherangany"],
    chiefs: {
        "Kwanza": ["Kwanza Chief's Office", "Kapomboi Chief's Office", "Bidii Chief's Office", "Keiyo Chief's Office"],
        "Endebess": ["Endebess Chief's Office", "Chepchoina Chief's Office", "Matumbei Chief's Office"],
        "Saboti": ["Saboti Chief's Office", "Machewa Chief's Office", "Tuwani Chief's Office", "Kinyoro Chief's Office"],
        "Kiminini": ["Kiminini Chief's Office", "Waitaluk Chief's Office", "Sirende Chief's Office", "Hospital Chief's Office"],
        "Cherangany": ["Cherangany Chief's Office", "Makutano Chief's Office", "Chepsiro/Kiptoror Chief's Office", "Motonto Chief's Office"]
    }
},
elgeyo_marakwet: {
    constituencies: ["Marakwet East", "Marakwet West", "Keiyo North", "Keiyo South"],
    chiefs: {
        "Marakwet East": ["Kapyego Chief's Office", "Sambirir Chief's Office", "Endo Chief's Office", "Embobut/Embulot Chief's Office"],
        "Marakwet West": ["Kapsowar Chief's Office", "Lelan Chief's Office", "Sengwer Chief's Office", "Cherang'any/Chebororwa Chief's Office"],
        "Keiyo North": ["Emsoo Chief's Office", "Kabiemit Chief's Office", "Birbiriet Chief's Office", "Kaptarakwa Chief's Office"],
        "Keiyo South": ["Keiyo South Chief's Office", "Metkei Chief's Office", "Tambach Chief's Office", "Tarakwa Chief's Office"]
    }
},
tharaka_nithi: {
    constituencies: ["Tharaka", "Chuka/Igambang'ombe", "Maara"],
    chiefs: {
        "Tharaka": ["Tharaka Chief's Office", "Marimanti Chief's Office", "Mukothima Chief's Office", "Nkondi Chief's Office"],
        "Chuka/Igambang'ombe": ["Chuka Chief's Office", "Igambang'ombe Chief's Office", "Mugwe Chief's Office", "Karingani Chief's Office"],
        "Maara": ["Maara Chief's Office", "Ganga Chief's Office", "Chogoria Chief's Office", "Thuuchi Chief's Office"]
    }
},
tana_river: {
    constituencies: ["Garsen", "Galole", "Bura"],
    chiefs: {
        "Garsen": ["Garsen Chief's Office", "Kipini Chief's Office", "Garsen South Chief's Office", "Garsen Central Chief's Office"],
        "Galole": ["Galole Chief's Office", "Wayu Chief's Office", "Chewani Chief's Office", "Mikinduni Chief's Office"],
        "Bura": ["Bura Chief's Office", "Madogo Chief's Office", "Bangale Chief's Office", "Sala Chief's Office"]
    }
},
taita_taveta: {
    constituencies: ["Taveta", "Wundanyi", "Mwatate", "Voi"],
    chiefs: {
        "Taveta": ["Taveta Chief's Office", "Challa Chief's Office", "Bomeni Chief's Office", "Mahoo Chief's Office"],
        "Wundanyi": ["Wundanyi Chief's Office", "Wusi/Kishushe Chief's Office", "Werugha Chief's Office", "Mbololo Chief's Office"],
        "Mwatate": ["Mwatate Chief's Office", "Bura Chief's Office", "Chawia Chief's Office", "Wumingu/Kishushe Chief's Office"],
        "Voi": ["Voi Chief's Office", "Sagalla Chief's Office", "Kaloleni Chief's Office", "Marungu Chief's Office"]
    }
},
muranga: {
    constituencies: ["Kiharu", "Mathioya", "Kigumo", "Maragua", "Kandara", "Gatanga", "Kanyekini"],
    chiefs: {
        "Kiharu": ["Kiharu Chief's Office", "Mugoiri Chief's Office", "Mbiri Chief's Office", "Township Chief's Office"],
        "Mathioya": ["Mathioya Chief's Office", "Kiru Chief's Office", "Kamacharia Chief's Office", "Ichagaki Chief's Office"],
        "Kigumo": ["Kigumo Chief's Office", "Kangari Chief's Office", "Kahumbu Chief's Office", "Muthithi Chief's Office"],
        "Maragua": ["Maragua Chief's Office", "Kamahuha Chief's Office", "Ichagaki Chief's Office", "Nginda Chief's Office"],
        "Kandara": ["Kandara Chief's Office", "Ng'araria Chief's Office", "Muruka Chief's Office", "Kagundu-ini Chief's Office"],
        "Gatanga": ["Gatanga Chief's Office", "Kariara Chief's Office", "Mukarara Chief's Office", "Ithanga Chief's Office"],
        "Kanyekini": ["Kanyekini Chief's Office", "Gaichanjiru Chief's Office", "Kihumbu-ini Chief's Office", "Mbiri Chief's Office"]
    }
},
homa_bay: {
    constituencies: ["Kasipul", "Kabondo Kasipul", "Karachuonyo", "Rangwe", "Homa Bay Town", "Ndhiwa", "Suba North", "Suba South"],
    chiefs: {
        "Kasipul": ["Kasipul Chief's Office", "West Kasipul Chief's Office", "Central Kasipul Chief's Office", "East Kasipul Chief's Office"],
        "Kabondo Kasipul": ["Kabondo Chief's Office", "Kokwanyo/Kakelo Chief's Office", "Kojwach Chief's Office"],
        "Karachuonyo": ["Karachuonyo Chief's Office", "Wangchieng Chief's Office", "Kendu Bay Town Chief's Office", "Kanyamwa Kosewe Chief's Office"],
        "Rangwe": ["Rangwe Chief's Office", "Kagan Chief's Office", "Gem Nam Chief's Office", "Kochia Chief's Office"],
        "Homa Bay Town": ["Homa Bay Central Chief's Office", "Homa Bay Arujo Chief's Office", "Homa Bay West Chief's Office", "Homa Bay East Chief's Office"],
        "Ndhiwa": ["Ndhiwa Chief's Office", "Kwabwai Chief's Office", "Kanyadoto Chief's Office", "Kanyikela Chief's Office"],
        "Suba North": ["Mfangano Island Chief's Office", "Rusinga Island Chief's Office", "Kasgunga Chief's Office", "Lambwe Chief's Office"],
        "Suba South": ["Suba South Chief's Office", "Kaksingri West Chief's Office", "Ruma-Kaksingri East Chief's Office", "God Jope Chief's Office"]
    }
}
};

let documentCounter = 1;
let totalReward = 100; // Default for first document

// Document management functions
function updateTotalReward() {
    const documentItems = document.querySelectorAll('.document-item');
    let total = 0;
    
    documentItems.forEach(item => {
        const select = item.querySelector('.document-type');
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.dataset.reward) {
            total += parseInt(selectedOption.dataset.reward);
        }
    });
    
    totalReward = Math.max(total, 100); // Minimum 100 KSh
    document.querySelector('#total-reward .amount').textContent = `KSh ${totalReward.toLocaleString()}`;
    document.getElementById('document-count').textContent = documentItems.length;
}

function updateDocumentReward(documentItem) {
    const select = documentItem.querySelector('.document-type');
    const rewardBadge = documentItem.querySelector('.document-reward');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.reward) {
        const reward = selectedOption.dataset.reward;
        const category = selectedOption.dataset.category;
        rewardBadge.textContent = `KSh ${reward}`;
        rewardBadge.innerHTML = `KSh ${reward} <span class="document-category">${category}</span>`;
    }
    
    updateTotalReward();
}

function createDocumentItem(index) {
    const documentHTML = `
        <div class="document-item" data-document-index="${index}">
            <button type="button" class="remove-document" onclick="removeDocument(${index})">
                <i class="fas fa-times"></i>
            </button>
            <h4><span class="document-counter">${index}</span> Document Details</h4>
            
            <div class="form-group">
                <label>What type of document is this? 
                    <span class="reward-badge document-reward">KSh 100</span>
                </label>
                <select class="document-type" required>
                    <option value="">Select document type</option>
                    
                    <!-- Government Identification -->
                    <optgroup label="🆔 Government Identification">
                        <option value="national-id" data-reward="150" data-category="Gov ID">National ID Card</option>
                        <option value="passport" data-reward="500" data-category="Gov ID">Kenyan Passport</option>
                        <option value="alien-id" data-reward="200" data-category="Gov ID">Alien ID Card</option>
                        <option value="refugee-id" data-reward="180" data-category="Gov ID">Refugee ID</option>
                        <option value="military-id" data-reward="250" data-category="Gov ID">Military ID</option>
                    </optgroup>
                    
                    <!-- Driving & Vehicle -->
                    <optgroup label="🚗 Driving & Vehicle">
                        <option value="driving-license" data-reward="200" data-category="Transport">Driving License</option>
                        <option value="logbook" data-reward="800" data-category="Transport">Vehicle Logbook</option>
                        <option value="psi-certificate" data-reward="150" data-category="Transport">PSI Certificate</option>
                        <option value="towing-permit" data-reward="100" data-category="Transport">Towing Permit</option>
                        <option value="badge" data-reward="120" data-category="Transport">PSV Badge</option>
                    </optgroup>
                    
                    <!-- Education -->
                    <optgroup label="🎓 Educational Documents">
                        <option value="kcpe-certificate" data-reward="150" data-category="Education">KCPE Certificate</option>
                        <option value="kcse-certificate" data-reward="200" data-category="Education">KCSE Certificate</option>
                        <option value="university-degree" data-reward="400" data-category="Education">University Degree</option>
                        <option value="college-diploma" data-reward="300" data-category="Education">College Diploma/Certificate</option>
                        <option value="transcript" data-reward="250" data-category="Education">Official Transcript</option>
                        <option value="student-id" data-reward="80" data-category="Education">Student ID Card</option>
                    </optgroup>
                    
                    <!-- Professional -->
                    <optgroup label="💼 Professional Documents">
                        <option value="work-permit" data-reward="400" data-category="Professional">Work Permit</option>
                        <option value="professional-license" data-reward="300" data-category="Professional">Professional License</option>
                        <option value="practicing-certificate" data-reward="350" data-category="Professional">Practicing Certificate</option>
                        <option value="tax-pin" data-reward="100" data-category="Professional">KRA PIN Certificate</option>
                        <option value="business-permit" data-reward="250" data-category="Professional">Business Permit</option>
                    </optgroup>
                    
                    <!-- Property & Legal -->
                    <optgroup label="🏠 Property & Legal">
                        <option value="title-deed" data-reward="1000" data-category="Property">Title Deed</option>
                        <option value="lease-agreement" data-reward="300" data-category="Property">Lease Agreement</option>
                        <option value="allotment-letter" data-reward="400" data-category="Property">Land Allotment Letter</option>
                        <option value="court-order" data-reward="500" data-category="Legal">Court Order</option>
                        <option value="power-attorney" data-reward="350" data-category="Legal">Power of Attorney</option>
                    </optgroup>
                    
                    <!-- Financial -->
                    <optgroup label="💳 Financial Documents">
                        <option value="bank-card" data-reward="100" data-category="Financial">Bank/ATM Card</option>
                        <option value="checkbook" data-reward="150" data-category="Financial">Checkbook</option>
                        <option value="loan-agreement" data-reward="200" data-category="Financial">Loan Agreement</option>
                        <option value="insurance-policy" data-reward="180" data-category="Financial">Insurance Policy</option>
                    </optgroup>
                    
                    <!-- Health -->
                    <optgroup label="🏥 Health Documents">
                        <option value="birth-certificate" data-reward="200" data-category="Health">Birth Certificate</option>
                        <option value="death-certificate" data-reward="250" data-category="Health">Death Certificate</option>
                        <option value="marriage-certificate" data-reward="300" data-category="Health">Marriage Certificate</option>
                        <option value="medical-report" data-reward="120" data-category="Health">Medical Report</option>
                        <option value="nhif-card" data-reward="80" data-category="Health">NHIF Card</option>
                    </optgroup>
                    
                    <!-- Other Important -->
                    <optgroup label="📄 Other Important">
                        <option value="will" data-reward="600" data-category="Legal">Will/Testament</option>
                        <option value="adoption-papers" data-reward="400" data-category="Legal">Adoption Papers</option>
                        <option value="guardianship" data-reward="350" data-category="Legal">Guardianship Papers</option>
                        <option value="other" data-reward="50" data-category="Other">Other Document</option>
                    </optgroup>
                </select>
            </div>
            
            <div class="form-group">
                <label>Document Number (if visible)</label>
                <input type="text" class="document-number" placeholder="e.g. 12345678 or visible reference number">
            </div>
            
            <div class="form-group">
                <label>Upload Clear Photo of Document</label>
                <div class="upload-area document-upload">
                    <i class="fas fa-camera"></i>
                    <p><strong>Click to upload photo of this document</strong></p>
                    <p class="small">Clear photos help us verify ownership faster</p>
                    <input type="file" class="file-input" accept="image/*" style="display: none;">
                    <div class="file-name"></div>
                </div>
            </div>
        </div>
    `;
    return documentHTML;
}

function removeDocument(index) {
    const documentItem = document.querySelector(`[data-document-index="${index}"]`);
    if (documentItem && document.querySelectorAll('.document-item').length > 1) {
        documentItem.remove();
        updateTotalReward();
        renumberDocuments();
    }
}

function renumberDocuments() {
    const documentItems = document.querySelectorAll('.document-item');
    documentItems.forEach((item, index) => {
        const newIndex = index + 1;
        item.setAttribute('data-document-index', newIndex);
        item.querySelector('.document-counter').textContent = newIndex;
        const removeBtn = item.querySelector('.remove-document');
        removeBtn.setAttribute('onclick', `removeDocument(${newIndex})`);
    });
}

// Location selection functions
function setupLocationSelection() {
    const countySelect = document.getElementById('county');
    const constituencySelect = document.getElementById('constituency');
    const chiefsSelect = document.getElementById('chiefs-office');
    
    countySelect.addEventListener('change', function() {
        const county = this.value;
        
        // Reset subsequent selections
        constituencySelect.innerHTML = '<option value="">Select Constituency</option>';
        chiefsSelect.innerHTML = '<option value="">Select Chief\'s Office</option>';
        document.getElementById('constituency-selection').style.display = 'none';
        document.getElementById('chiefs-selection').style.display = 'none';
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step3').classList.remove('active');
        
        if (county && counties[county]) {
            // Populate constituencies
            counties[county].constituencies.forEach(constituency => {
                const option = document.createElement('option');
                option.value = constituency.toLowerCase().replace(/\s+/g, '-');
                option.textContent = constituency;
                constituencySelect.appendChild(option);
            });
            
            document.getElementById('constituency-selection').style.display = 'block';
            document.getElementById('step2').classList.add('active');
        }
    });
    
    constituencySelect.addEventListener('change', function() {
        const constituency = this.options[this.selectedIndex].text;
        const county = countySelect.value;
        
        // Reset chiefs selection
        chiefsSelect.innerHTML = '<option value="">Select Chief\'s Office</option>';
        document.getElementById('chiefs-selection').style.display = 'none';
        document.getElementById('step3').classList.remove('active');
        
        if (constituency && counties[county] && counties[county].chiefs[constituency]) {
            // Populate chiefs offices
            counties[county].chiefs[constituency].forEach(office => {
                const option = document.createElement('option');
                option.value = office.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
                option.textContent = office;
                chiefsSelect.appendChild(option);
            });
            
            document.getElementById('chiefs-selection').style.display = 'block';
            document.getElementById('step3').classList.add('active');
        }
    });
    
    chiefsSelect.addEventListener('change', function() {
        if (this.value) {
            const selectedOffice = this.options[this.selectedIndex].text;
            const county = countySelect.options[countySelect.selectedIndex].text;
            const constituency = constituencySelect.options[constituencySelect.selectedIndex].text;
            
            document.getElementById('collection-point').value = `${selectedOffice}, ${constituency}, ${county}`;
        }
    });
}

// File upload handling
function setupFileUploads() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.upload-area')) {
            const uploadArea = e.target.closest('.upload-area');
            const fileInput = uploadArea.querySelector('.file-input');
            fileInput.click();
        }
    });
    
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('file-input')) {
            const fileInput = e.target;
            const uploadArea = fileInput.closest('.upload-area');
            const fileNameDiv = uploadArea.querySelector('.file-name');
            
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                fileNameDiv.innerHTML = `<i class="fas fa-check-circle" style="color: var(--kenya-green);"></i> ${fileName}`;
                uploadArea.style.borderColor = 'var(--kenya-green)';
                uploadArea.style.background = 'linear-gradient(135deg, rgba(0, 102, 0, 0.1), rgba(0, 0, 0, 0.05))';
            }
        }
    });
}

// Enhanced form submission with Supabase integration, owner matching, and photo upload
function setupFormSubmission() {
    const form = document.getElementById('found-form');
    if (!form) {
        console.error('❌ Could not find form with id "found-form"');
        return;
    }
    const formContainer = form.parentElement;
    const confirmation = document.getElementById('confirmation');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Found report form submitted');
        
        // Collect form data
        const formData = collectFormData();
        console.log('📋 Collected form data:', formData);
        
        // Validate required fields
        if (!validateForm(formData)) {
            console.warn('⚠️ Validation failed', formData);
            return;
        }
        
        let report = null;
        try {
            // 1. Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error('User not logged in');
            console.log('👤 Authenticated user:', user.email);
            
            // 2. Insert the main report (do NOT include finder details)
            const reportInsert = {
                user_id: user.id,
                report_type: 'found', // CRITICAL: This must be 'found'
                status: 'active',
                full_name: formData.finderName,
                phone: formData.finderPhone,
                email: user.email,
                location_description: formData.foundLocation,
                collection_point: formData.collectionPoint,
                reward_amount: formData.totalReward
            };
            
            if (formData.timeline) reportInsert.timeline = formData.timeline;
            if (formData.additionalDetails) reportInsert.additional_details = formData.additionalDetails;
            if (formData.recoveryFee) reportInsert.recovery_fee = formData.recoveryFee;
            
            console.log('📝 Inserting report with data:', reportInsert);
            
            const { data: report, error: reportError } = await supabase
                .from('reports')
                .insert(reportInsert)
                .select()
                .single();
                
            if (reportError) {
                console.error('❌ Error inserting report:', reportError);
                throw reportError;
            }
            
            console.log('✅ Report inserted successfully:', report);

            // 🔔 Send notification to user
            console.log('📤 About to create notification for found report:', { userId: user.id, reportId: report.id, userEmail: user.email });
            try {
                const notifResult = await supabase.from('notifications').insert({
                    user_id: user.id,
                    message: `📋 Your found ${formData.documents[0]?.type || 'document'} report has been registered. You'll be notified when the owner reports a lost document and we find a match.`,
                    type: 'info',
                    status: 'unread',
                    report_id: report.id,
                    created_at: new Date().toISOString()
                });
                console.log('📤 Notification creation result:', notifResult);
            } catch (notifError) {
                console.error('Notification error:', notifError);
                // Don't fail the report creation if notification fails
            }
            
            // 3. Insert finder details into finder_info table
            const { error: finderError } = await supabase
                .from('finder_info')
                .insert({
                    report_id: report.id,
                    finder_name: formData.finderName,
                    finder_id_number: formData.finderId,
                    finder_phone: formData.finderPhone
                });
                
            if (finderError) {
                console.error('❌ Error inserting finder info:', finderError);
                throw finderError;
            }
            
            console.log('✅ Finder info inserted successfully');
            
            // 4. Insert each document
            const documentItems = document.querySelectorAll('.document-item');
            for (let i = 0; i < formData.documents.length; i++) {
                const doc = formData.documents[i];
                const fileInput = documentItems[i].querySelector('.file-input');
                let photoUrl = null;
                
                if (fileInput && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;
                    
                    console.log('📸 Uploading document photo:', fileName);
                    
                    const { error: uploadError } = await supabase.storage
                        .from('document-photos')
                        .upload(fileName, file);
                        
                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('document-photos')
                            .getPublicUrl(fileName);
                        photoUrl = publicUrl;
                        console.log('✅ Photo uploaded successfully:', photoUrl);
                    } else {
                        console.error('❌ Error uploading document photo:', uploadError);
                    }
                }
                
                // Insert document record with owner info
                const documentInsert = {
                    report_id: report.id,
                    document_type: doc.value,
                    document_number: doc.number,
                    category: doc.category,
                    photo_url: photoUrl,
                    is_recovered: false,
                    owner_name: formData.ownerName, // Store owner name per document
                    owner_id_number: formData.ownerId // Store owner ID per document
                };
                
                console.log(`📄 Inserting document #${i+1}:`, documentInsert);
                
                const { error: docError } = await supabase.from('report_documents').insert(documentInsert);
                
                if (docError) {
                    console.error(`❌ Error inserting document #${i+1}:`, docError);
                    throw docError;
                }
                
                console.log(`✅ Document #${i+1} inserted successfully`);
            }
            
            // 5. Verify the report was actually created
            const { data: verifyReport, error: verifyError } = await supabase
                .from('reports')
                .select('*, report_documents(*)')
                .eq('id', report.id)
                .single();
                
            if (verifyError) {
                console.error('❌ Error verifying report creation:', verifyError);
            } else {
                console.log('✅ Report verification successful:', verifyReport);
                console.log(`📊 Report type: ${verifyReport.report_type}, Status: ${verifyReport.status}`);
                console.log(`📄 Documents attached: ${verifyReport.report_documents?.length || 0}`);
            }
            
            // Success actions (show confirmation, etc.)
            if (confirmation && formContainer) {
                showConfirmation(formData);
                confirmation.style.display = 'block';
                formContainer.style.display = 'none';
                console.log('🎉 Submission successful, confirmation shown');
                
                // Trigger matching immediately after successful submission
                setTimeout(async () => {
                    console.log('🔍 Triggering immediate matching after found report submission...');
                    if (typeof window.runAutomatedMatching === 'function') {
                        await window.runAutomatedMatching();
                    }
                }, 1000);
                
            } else {
                console.warn('⚠️ Could not find confirmation or form container for UI update');
            }
            
        } catch (error) {
            console.error('❌ Error submitting found report:', error);
            alert('Error submitting found report: ' + (error.message || error));
        }
    });
}

function collectFormData() {
    const documentItems = document.querySelectorAll('.document-item');
    const documents = [];
    
    documentItems.forEach(item => {
        const typeSelect = item.querySelector('.document-type');
        const selectedOption = typeSelect.options[typeSelect.selectedIndex];
        const documentNumber = item.querySelector('.document-number').value;
        const fileInput = item.querySelector('.file-input');
        
        if (selectedOption && selectedOption.value) {
            documents.push({
                value: selectedOption.value, // This is the value key (e.g. 'national-id')
                type: selectedOption.text,   // This is the visible text (e.g. 'National ID Card')
                category: selectedOption.dataset.category || 'Other',
                reward: parseInt(selectedOption.dataset.reward) || 50,
                number: documentNumber,
                hasPhoto: fileInput.files.length > 0
            });
        }
    });
    
    return {
        ownerName: document.getElementById('owner-name').value,
        ownerId: document.getElementById('owner-id').value,
        documents: documents,
        foundLocation: document.getElementById('found-location').value,
        collectionPoint: document.getElementById('collection-point').value,
        finderName: document.getElementById('your-name').value,
        finderId: document.getElementById('your-id').value,
        finderPhone: document.getElementById('your-phone').value,
        totalReward: totalReward
    };
}

function validateForm(formData) {
    const required = ['foundLocation', 'collectionPoint', 'finderName', 'finderId', 'finderPhone'];
    
    for (let field of required) {
        if (!formData[field]) {
            alert(`Please fill in all required fields. Missing: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return false;
        }
    }
    
    if (formData.documents.length === 0) {
        alert('Please add at least one document.');
        return false;
    }
    // Validate every document has a non-empty type
    for (let i = 0; i < formData.documents.length; i++) {
        if (!formData.documents[i].type || formData.documents[i].type.trim() === '') {
            alert(`Please select a document type for document #${i + 1}.`);
            return false;
        }
    }
    // Validate phone number format
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(formData.finderPhone)) {
        alert('Please enter a valid Kenyan phone number (e.g., 0712345678)');
        return false;
    }
    
    return true;
}

// In showConfirmation, ensure collectionPoint is shown as a reminder
function showConfirmation(formData) {
    document.getElementById('confirmed-location').textContent = formData.collectionPoint || '[Selected Chief\'s Office]';
    document.getElementById('confirmed-reward').textContent = `KSh ${formData.totalReward.toLocaleString()}`;
    document.getElementById('confirmed-phone').textContent = formData.finderPhone;
    
    // Generate documents summary
    const summaryContainer = document.getElementById('documents-summary');
    let summaryHTML = '<div class="document-summary">';
    
    if (formData.ownerName) {
        summaryHTML += `<h4>Documents for: ${formData.ownerName}</h4>`;
    } else {
        summaryHTML += `<h4>Documents Found</h4>`;
    }
    
    summaryHTML += `<p><strong>Total Documents:</strong> ${formData.documents.length}</p>`;
    summaryHTML += `<p><strong>Found at:</strong> ${formData.foundLocation}</p>`;
    
    formData.documents.forEach((doc, index) => {
        summaryHTML += `<p>• ${doc.type} ${doc.number ? `(${doc.number})` : ''} - KSh ${doc.reward}</p>`;
    });
    
    summaryHTML += '</div>';
    summaryContainer.innerHTML = summaryHTML;
    
    // Run automated matching after a short delay to ensure the report is fully saved
    setTimeout(async () => {
        if (typeof window.runAutomatedMatching === 'function') {
            console.log('🔍 Running automated matching after found report submission...');
            await window.runAutomatedMatching();
        }
    }, 2000);
}

// Event listeners for document type changes
function setupDocumentTypeListeners() {
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('document-type')) {
            const documentItem = e.target.closest('.document-item');
            updateDocumentReward(documentItem);
        }
    });
}

// Add document functionality
function setupAddDocument() {
    document.getElementById('add-document').addEventListener('click', function() {
        documentCounter++;
        const container = document.getElementById('documents-container');
        container.insertAdjacentHTML('beforeend', createDocumentItem(documentCounter));
        updateTotalReward();
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupLocationSelection();
    setupFileUploads();
    setupFormSubmission();
    setupDocumentTypeListeners();
    setupAddDocument();
    
    // Initialize first document reward
    updateTotalReward();
});

// Global function for remove document (called from HTML)
window.removeDocument = removeDocument;

// Create notification for found report submission
async function createFoundReportNotification(userId, reportId, documentCount) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title: 'Found Report Submitted',
                message: `Your found report for ${documentCount} document${documentCount > 1 ? 's' : ''} has been submitted successfully. We'll notify you when the owner claims the document.`,
                type: 'report_submission',
                status: 'unread',
                related_id: reportId,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error creating found report notification:', error);
            return null;
        }
        
        console.log('✅ Found report notification created successfully:', data);
        return data;
    } catch (error) {
        console.error('Error in createFoundReportNotification:', error);
        return null;
    }
}

// Replace docTypeMap with snake_case keys
const docTypeMap = {
    'national_id': 'National ID Card',
    'passport': 'Kenyan Passport',
    'alien_id': 'Alien ID Card',
    'refugee_id': 'Refugee ID',
    'military_id': 'Military ID',
    'driving_license': 'Driving License',
    'logbook': 'Vehicle Logbook',
    'psi_certificate': 'PSI Certificate',
    'towing_permit': 'Towing Permit',
    'badge': 'PSV Badge',
    'kcpe_certificate': 'KCPE Certificate',
    'kcse_certificate': 'KCSE Certificate',
    'university_degree': 'University Degree',
    'college_diploma': 'College Diploma/Certificate',
    'transcript': 'Official Transcript',
    'student_id': 'Student ID Card',
    'work_permit': 'Work Permit',
    'professional_license': 'Professional License',
    'practicing_certificate': 'Practicing Certificate',
    'kra_pin': 'KRA PIN Certificate',
    'business_permit': 'Business Permit',
    'title_deed': 'Title Deed',
    'lease_agreement': 'Lease Agreement',
    'allotment_letter': 'Land Allotment Letter',
    'court_order': 'Court Order',
    'power_attorney': 'Power of Attorney',
    'bank_card': 'Bank/ATM Card',
    'checkbook': 'Checkbook',
    'loan_agreement': 'Loan Agreement',
    'insurance_policy': 'Insurance Policy',
    'birth_certificate': 'Birth Certificate',
    'death_certificate': 'Death Certificate',
    'marriage_certificate': 'Marriage Certificate',
    'medical_report': 'Medical Report',
    'nhif_card': 'NHIF Card',
    'will': 'Will/Testament',
    'adoption_papers': 'Adoption Papers',
    'guardianship': 'Guardianship Papers',
    'other': 'Other Document'
};
function getReadableDocType(type) {
    return docTypeMap[type] || type || 'Unknown Document';
}

// ===== COMPREHENSIVE DEBUGGING FUNCTIONS =====

// Debug function to check if found reports are being created properly
window.debugFoundReports = async function() {
    console.log('🔍 === FOUND REPORTS DEBUG ===');
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('❌ User not authenticated');
            return;
        }
        
        console.log('👤 Current user:', user.email);
        
        // Check all reports for this user
        const { data: userReports, error: reportsError } = await supabase
            .from('reports')
            .select('*, report_documents(*)')
            .eq('user_id', user.id);
            
        if (reportsError) {
            console.error('❌ Error fetching user reports:', reportsError);
            return;
        }
        
        console.log(`📊 Total reports for user: ${userReports.length}`);
        
        // Check found reports specifically
        const foundReports = userReports.filter(r => r.report_type === 'found');
        const lostReports = userReports.filter(r => r.report_type === 'lost');
        
        console.log(`📋 Found reports: ${foundReports.length}`);
        console.log(`📋 Lost reports: ${lostReports.length}`);
        
        // Show details of each found report
        foundReports.forEach((report, index) => {
            console.log(`\n📄 Found Report #${index + 1}:`);
            console.log(`   ID: ${report.id}`);
            console.log(`   Type: ${report.report_type}`);
            console.log(`   Status: ${report.status}`);
            console.log(`   Created: ${report.created_at}`);
            console.log(`   Documents: ${report.report_documents?.length || 0}`);
            
            if (report.report_documents && report.report_documents.length > 0) {
                report.report_documents.forEach((doc, docIndex) => {
                    console.log(`     Document ${docIndex + 1}: ${doc.document_type} (${doc.document_number})`);
                });
            }
        });
        
        // Check all reports in database (not just user's)
        const { data: allReports, error: allReportsError } = await supabase
            .from('reports')
            .select('*');
            
        if (allReportsError) {
            console.error('❌ Error fetching all reports:', allReportsError);
        } else {
            const allFoundReports = allReports.filter(r => r.report_type === 'found');
            const allLostReports = allReports.filter(r => r.report_type === 'lost');
            
            console.log(`\n🌐 Database-wide stats:`);
            console.log(`   Total found reports: ${allFoundReports.length}`);
            console.log(`   Total lost reports: ${allLostReports.length}`);
            
            // Show status breakdown
            const statusCounts = {};
            allReports.forEach(r => {
                statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
            });
            console.log('   Status breakdown:', statusCounts);
        }
        
        console.log('🔍 === END FOUND REPORTS DEBUG ===');
        
    } catch (error) {
        console.error('❌ Error in debugFoundReports:', error);
    }
};

// Test function to create a found report manually
window.testCreateFoundReport = async function() {
    console.log('🧪 === TESTING FOUND REPORT CREATION ===');
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('❌ User not authenticated');
            return;
        }
        
        // Create a test found report
        const testReport = {
            user_id: user.id,
            report_type: 'found',
            status: 'active',
            full_name: 'Test Finder',
            phone: '0712345678',
            email: user.email,
            location_description: 'Test Location',
            collection_point: 'Test Chief\'s Office',
            reward_amount: 100
        };
        
        console.log('📝 Creating test found report:', testReport);
        
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .insert(testReport)
            .select()
            .single();
            
        if (reportError) {
            console.error('❌ Error creating test report:', reportError);
            return;
        }
        
        console.log('✅ Test found report created:', report);
        
        // Create a test document
        const testDocument = {
            report_id: report.id,
            document_type: 'military_id',
            document_number: 'TEST123456',
            category: 'Gov ID',
            is_recovered: false
        };
        
        console.log('📄 Creating test document:', testDocument);
        
        const { error: docError } = await supabase
            .from('report_documents')
            .insert(testDocument);
            
        if (docError) {
            console.error('❌ Error creating test document:', docError);
        } else {
            console.log('✅ Test document created successfully');
        }
        
        // Verify the report was created
        const { data: verifyReport, error: verifyError } = await supabase
            .from('reports')
            .select('*, report_documents(*)')
            .eq('id', report.id)
            .single();
            
        if (verifyError) {
            console.error('❌ Error verifying test report:', verifyError);
        } else {
            console.log('✅ Test report verification:', verifyReport);
        }
        
        console.log('🧪 === END TEST ===');
        
    } catch (error) {
        console.error('❌ Error in testCreateFoundReport:', error);
    }
};

// Function to check database tables and permissions
window.debugDatabaseTables = async function() {
    console.log('🔍 === DATABASE TABLES DEBUG ===');
    
    try {
        // Test each table
        const tables = ['reports', 'report_documents', 'finder_info', 'recovered_reports'];
        
        for (const table of tables) {
            console.log(`\n📋 Testing table: ${table}`);
            
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                if (error) {
                    console.error(`❌ Error accessing ${table}:`, error);
                } else {
                    console.log(`✅ ${table} accessible, sample data:`, data);
                }
            } catch (err) {
                console.error(`❌ Exception accessing ${table}:`, err);
            }
        }
        
        console.log('🔍 === END DATABASE TABLES DEBUG ===');
        
    } catch (error) {
        console.error('❌ Error in debugDatabaseTables:', error);
    }
};

// Test function to create a found report with matching document number
window.testCreateMatchingFoundReport = async function() {
    console.log('🧪 === TESTING MATCHING FOUND REPORT CREATION ===');
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('❌ User not authenticated');
            return;
        }
        
        // Create a test found report with the EXACT same document number as the lost report
        const testReport = {
            user_id: user.id,
            report_type: 'found',
            status: 'active',
            full_name: 'Test Finder - Matching',
            phone: '0712345678',
            email: user.email,
            location_description: 'Test Location - Matching',
            collection_point: 'Test Chief\'s Office - Matching',
            reward_amount: 100
        };
        
        console.log('📝 Creating matching test found report:', testReport);
        
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .insert(testReport)
            .select()
            .single();
            
        if (reportError) {
            console.error('❌ Error creating test report:', reportError);
            return;
        }
        
        console.log('✅ Matching test found report created:', report);
        
        // Create a test document with the EXACT same number as the lost military ID
        const testDocument = {
            report_id: report.id,
            document_type: 'military_id',
            document_number: '454545', // EXACT SAME NUMBER AS LOST REPORT
            category: 'Gov ID',
            is_recovered: false
        };
        
        console.log('📄 Creating matching test document:', testDocument);
        
        const { error: docError } = await supabase
            .from('report_documents')
            .insert(testDocument);
            
        if (docError) {
            console.error('❌ Error creating test document:', docError);
        } else {
            console.log('✅ Matching test document created successfully');
        }
        
        // Verify the report was created
        const { data: verifyReport, error: verifyError } = await supabase
            .from('reports')
            .select('*, report_documents(*)')
            .eq('id', report.id)
            .single();
            
        if (verifyError) {
            console.error('❌ Error verifying test report:', verifyError);
        } else {
            console.log('✅ Matching test report verification:', verifyReport);
        }
        
        console.log('🧪 === END MATCHING TEST ===');
        
        // Automatically run matching after creating the report
        setTimeout(async () => {
            console.log('🔍 Running matching after creating matching found report...');
            if (typeof window.runAutomatedMatching === 'function') {
                await window.runAutomatedMatching();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error in testCreateMatchingFoundReport:', error);
    }
};

// Function to remove test found reports
window.removeTestFoundReports = async function() {
    console.log('🗑️ === REMOVING TEST FOUND REPORTS ===');
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('❌ User not authenticated');
            return;
        }
        
        // Find all test found reports for this user
        const { data: testReports, error: reportsError } = await supabase
            .from('reports')
            .select('*, report_documents(*)')
            .eq('user_id', user.id)
            .eq('report_type', 'found')
            .or('full_name.like.%Test%');
            
        if (reportsError) {
            console.error('❌ Error fetching test reports:', reportsError);
            return;
        }
        
        console.log(`📋 Found ${testReports.length} test found reports to remove`);
        
        for (const report of testReports) {
            console.log(`🗑️ Removing test report: ${report.id} (${report.full_name})`);
            
            // First, remove associated documents
            if (report.report_documents && report.report_documents.length > 0) {
                const { error: docsError } = await supabase
                    .from('report_documents')
                    .delete()
                    .eq('report_id', report.id);
                    
                if (docsError) {
                    console.error(`❌ Error removing documents for report ${report.id}:`, docsError);
                } else {
                    console.log(`✅ Removed ${report.report_documents.length} documents for report ${report.id}`);
                }
            }
            
            // Remove finder info if it exists
            const { error: finderError } = await supabase
                .from('finder_info')
                .delete()
                .eq('report_id', report.id);
                
            if (finderError && finderError.code !== 'PGRST116') { // PGRST116 = no rows affected
                console.error(`❌ Error removing finder info for report ${report.id}:`, finderError);
            } else {
                console.log(`✅ Removed finder info for report ${report.id}`);
            }
            
            // Remove from recovered_reports if it exists
            const { error: recoveredError } = await supabase
                .from('recovered_reports')
                .delete()
                .or(`lost_report_id.eq.${report.id},found_report_id.eq.${report.id}`);
                
            if (recoveredError && recoveredError.code !== 'PGRST116') {
                console.error(`❌ Error removing from recovered_reports for report ${report.id}:`, recoveredError);
            } else {
                console.log(`✅ Removed from recovered_reports for report ${report.id}`);
            }
            
            // Finally, remove the report itself
            const { error: reportError } = await supabase
                .from('reports')
                .delete()
                .eq('id', report.id);
                
            if (reportError) {
                console.error(`❌ Error removing report ${report.id}:`, reportError);
            } else {
                console.log(`✅ Successfully removed test report ${report.id}`);
            }
        }
        
        console.log('🗑️ === END REMOVING TEST FOUND REPORTS ===');
        
        // Refresh the database state
        setTimeout(async () => {
            console.log('🔄 Refreshing database state...');
            if (typeof window.debugDatabase === 'function') {
                await window.debugDatabase();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error in removeTestFoundReports:', error);
    }
};

// Function to remove a specific test report by ID
window.removeSpecificTestReport = async function(reportId) {
    console.log(`🗑️ === REMOVING SPECIFIC TEST REPORT ${reportId} ===`);
    
    if (!reportId) {
        console.error('❌ No report ID provided');
        return;
    }
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('❌ User not authenticated');
            return;
        }
        
        // Verify the report belongs to the current user
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .eq('user_id', user.id)
            .single();
            
        if (reportError || !report) {
            console.error('❌ Report not found or does not belong to current user');
            return;
        }
        
        console.log(`🗑️ Removing report: ${report.id} (${report.full_name})`);
        
        // Remove associated documents
        const { error: docsError } = await supabase
            .from('report_documents')
            .delete()
            .eq('report_id', report.id);
            
        if (docsError) {
            console.error(`❌ Error removing documents:`, docsError);
        } else {
            console.log(`✅ Removed documents for report ${report.id}`);
        }
        
        // Remove finder info
        const { error: finderError } = await supabase
            .from('finder_info')
            .delete()
            .eq('report_id', report.id);
            
        if (finderError && finderError.code !== 'PGRST116') {
            console.error(`❌ Error removing finder info:`, finderError);
        } else {
            console.log(`✅ Removed finder info for report ${report.id}`);
        }
        
        // Remove from recovered_reports
        const { error: recoveredError } = await supabase
            .from('recovered_reports')
            .delete()
            .or(`lost_report_id.eq.${report.id},found_report_id.eq.${report.id}`);
            
        if (recoveredError && recoveredError.code !== 'PGRST116') {
            console.error(`❌ Error removing from recovered_reports:`, recoveredError);
        } else {
            console.log(`✅ Removed from recovered_reports for report ${report.id}`);
        }
        
        // Remove the report itself
        const { error: deleteError } = await supabase
            .from('reports')
            .delete()
            .eq('id', report.id);
            
        if (deleteError) {
            console.error(`❌ Error removing report:`, deleteError);
        } else {
            console.log(`✅ Successfully removed report ${report.id}`);
        }
        
        console.log(`🗑️ === END REMOVING SPECIFIC TEST REPORT ${reportId} ===`);
        
    } catch (error) {
        console.error('❌ Error in removeSpecificTestReport:', error);
    }
};