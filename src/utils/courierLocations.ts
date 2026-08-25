export interface MetturBranch {
  name: string;
  landmark?: string;
  type: 'HUB' | 'BRANCH' | 'AGENCY';
}

export interface MetturDistrict {
  district: string;
  branches: MetturBranch[];
}

export interface MetturStateCoverage {
  state: string;
  districts: MetturDistrict[];
}

export const METTUR_PARCEL_COVERAGE: MetturStateCoverage[] = [
  {
    state: 'Tamil Nadu',
    districts: [
      {
        district: 'Salem',
        branches: [
          { name: 'Salem Main Central Hub (Shevapet)', type: 'HUB' },
          { name: 'Salem New Bus Stand Branch', type: 'BRANCH' },
          { name: 'Salem Old Bus Stand / Gugai Branch', type: 'BRANCH' },
          { name: 'Salem Junction / Suramangalam Branch', type: 'BRANCH' },
          { name: 'Attur Main Town Branch', type: 'HUB' },
          { name: 'Mettur Dam Town Branch', type: 'HUB' },
          { name: 'Mettur RS / Kolathur Branch', type: 'BRANCH' },
          { name: 'Omalur Main Branch', type: 'BRANCH' },
          { name: 'Sankari Town Branch', type: 'BRANCH' },
          { name: 'Edappadi Town Branch', type: 'BRANCH' },
          { name: 'Vazhapadi Main Branch', type: 'BRANCH' },
          { name: 'Jalakandapuram Branch', type: 'BRANCH' },
          { name: 'Mecheri Town Branch', type: 'BRANCH' },
          { name: 'Tharamangalam Branch', type: 'BRANCH' },
          { name: 'Thammampatti Branch', type: 'BRANCH' },
          { name: 'Pethanaickenpalayam Agency', type: 'AGENCY' },
          { name: 'Konganapuram Agency', type: 'AGENCY' },
          { name: 'Magudanchavadi Branch', type: 'BRANCH' },
          { name: 'Ayothiyapattinam Branch', type: 'BRANCH' },
          { name: 'Karuppur / Omalur NH Branch', type: 'BRANCH' },
          { name: 'Nangavalli Agency', type: 'AGENCY' },
          { name: 'Kolathur Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Dharmapuri',
        branches: [
          { name: 'Pennagaram Branch (Nursery Direct Hub)', type: 'HUB' },
          { name: 'Dharmapuri Town Main Office (Near Bus Stand)', type: 'HUB' },
          { name: 'Dharmapuri Four Roads Branch', type: 'BRANCH' },
          { name: 'Harur Main Branch', type: 'BRANCH' },
          { name: 'Palacode Town Branch', type: 'BRANCH' },
          { name: 'Pappireddipatti Branch', type: 'BRANCH' },
          { name: 'Karimangalam Branch', type: 'BRANCH' },
          { name: 'Marandahalli Branch', type: 'BRANCH' },
          { name: 'Kadathur Branch', type: 'BRANCH' },
          { name: 'Morappur Branch', type: 'BRANCH' },
          { name: 'Kambainallur Agency', type: 'AGENCY' },
          { name: 'B.Mallapuram Agency', type: 'AGENCY' },
          { name: 'Eriyur Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Krishnagiri',
        branches: [
          { name: 'Hosur Main Central Hub (Bagalur Rd)', type: 'HUB' },
          { name: 'Hosur SIPCOT Industrial Branch', type: 'BRANCH' },
          { name: 'Hosur Bus Stand / Ring Road Branch', type: 'BRANCH' },
          { name: 'Krishnagiri Town Main Hub (Old Bus Stand)', type: 'HUB' },
          { name: 'Krishnagiri New Bus Stand / Tollgate Branch', type: 'BRANCH' },
          { name: 'Pochampalli Branch', type: 'BRANCH' },
          { name: 'Uthangarai Town Branch', type: 'BRANCH' },
          { name: 'Bargur Town Branch', type: 'BRANCH' },
          { name: 'Denkanikottai Branch', type: 'BRANCH' },
          { name: 'Kaveripattinam Branch', type: 'BRANCH' },
          { name: 'Rayakottai Branch', type: 'BRANCH' },
          { name: 'Kelamangalam Branch', type: 'BRANCH' },
          { name: 'Shoolagiri Branch', type: 'BRANCH' },
          { name: 'Mathur Branch', type: 'BRANCH' },
          { name: 'Anchetty Agency', type: 'AGENCY' },
          { name: 'Singarapettai Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Coimbatore',
        branches: [
          { name: 'Gandhipuram Central Parcel Hub (Cross Cut Rd)', type: 'HUB' },
          { name: 'Ukkadam / Town Hall Main Branch', type: 'HUB' },
          { name: 'Singanallur Trichy Road Branch', type: 'HUB' },
          { name: 'RS Puram / DB Road Branch', type: 'BRANCH' },
          { name: 'Peelamedu / Avinashi Road Branch', type: 'BRANCH' },
          { name: 'Saravanampatti Sathy Road Branch', type: 'BRANCH' },
          { name: 'Thudiyalur Mettupalayam Rd Branch', type: 'BRANCH' },
          { name: 'Pollachi Main Hub (Market Road)', type: 'HUB' },
          { name: 'Pollachi New Bus Stand Branch', type: 'BRANCH' },
          { name: 'Mettupalayam Main Town Hub', type: 'HUB' },
          { name: 'Mettupalayam Karamadai Branch', type: 'BRANCH' },
          { name: 'Sulur Trichy Road Branch', type: 'BRANCH' },
          { name: 'Sundarapuram Pollachi Road Branch', type: 'BRANCH' },
          { name: 'Kinathukadavu Branch', type: 'BRANCH' },
          { name: 'Annur Sathy Road Branch', type: 'BRANCH' },
          { name: 'Karumathampatti NH Branch', type: 'BRANCH' },
          { name: 'Vadavalli Branch', type: 'BRANCH' },
          { name: 'Perur Main Branch', type: 'BRANCH' },
          { name: 'Madukkarai / SIDCO Branch', type: 'BRANCH' },
          { name: 'Anaimalai Branch', type: 'BRANCH' },
          { name: 'Valparai Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Erode',
        branches: [
          { name: 'Erode Central Main Hub (Park Road / PS Park)', type: 'HUB' },
          { name: 'Erode Solar Bus Stand / Karur Rd Branch', type: 'BRANCH' },
          { name: 'Bhavani Town Main Branch', type: 'HUB' },
          { name: 'Gobichettipalayam Town Hub', type: 'HUB' },
          { name: 'Perundurai Main NH Hub', type: 'HUB' },
          { name: 'Perundurai SIPCOT Industrial Branch', type: 'BRANCH' },
          { name: 'Sathyamangalam Main Town Branch', type: 'HUB' },
          { name: 'Anthiyur Main Branch', type: 'BRANCH' },
          { name: 'Kodumudi Town Branch', type: 'BRANCH' },
          { name: 'Modakkurichi Branch', type: 'BRANCH' },
          { name: 'Chennimalai Town Branch', type: 'BRANCH' },
          { name: 'Nambiyur Branch', type: 'BRANCH' },
          { name: 'Sivagiri Branch', type: 'BRANCH' },
          { name: 'Chithode NH Bypass Branch', type: 'BRANCH' },
          { name: 'Appakudal Agency', type: 'AGENCY' },
          { name: 'Thalavadi Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Tirupur',
        branches: [
          { name: 'Tirupur Central Hub (Old Bus Stand / PN Rd)', type: 'HUB' },
          { name: 'Tirupur New Bus Stand / Avinashi Rd Branch', type: 'BRANCH' },
          { name: 'Tirupur Kangeyam Road / Nallur Branch', type: 'BRANCH' },
          { name: 'Tirupur Palladam Road Branch', type: 'BRANCH' },
          { name: 'Avinashi Main Town Branch', type: 'HUB' },
          { name: 'Palladam Main Town Branch', type: 'HUB' },
          { name: 'Dharapuram Main Town Branch', type: 'HUB' },
          { name: 'Kangeyam Main Town Branch', type: 'HUB' },
          { name: 'Udumalpet Central Town Hub', type: 'HUB' },
          { name: 'Vellakoil Town Branch', type: 'BRANCH' },
          { name: 'Uthukuli Town Branch', type: 'BRANCH' },
          { name: 'Madathukulam Branch', type: 'BRANCH' },
          { name: 'Kundadam Agency', type: 'AGENCY' },
          { name: 'Mulanur Agency', type: 'AGENCY' },
          { name: 'Kunnathur Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Namakkal',
        branches: [
          { name: 'Namakkal Town Main Hub (Salem Road)', type: 'HUB' },
          { name: 'Namakkal Bus Stand / Mohanur Rd Branch', type: 'BRANCH' },
          { name: 'Tiruchengode Central Hub (Velur Rd)', type: 'HUB' },
          { name: 'Rasipuram Town Main Branch', type: 'HUB' },
          { name: 'Paramathi Velur Town Branch', type: 'HUB' },
          { name: 'Komarapalayam Town Branch', type: 'HUB' },
          { name: 'Mohanur Town Branch', type: 'BRANCH' },
          { name: 'Sendamangalam Branch', type: 'BRANCH' },
          { name: 'Puduchatram NH Branch', type: 'BRANCH' },
          { name: 'Vennandur Branch', type: 'BRANCH' },
          { name: 'Mallasamudram Branch', type: 'BRANCH' },
          { name: 'Erumaipatty Branch', type: 'BRANCH' },
          { name: 'Kolli Hills (Semmedu Agency)', type: 'AGENCY' }
        ]
      },
      {
        district: 'Chennai',
        branches: [
          { name: 'Koyambedu Central Mega Parcel Hub', type: 'HUB' },
          { name: 'Parrys / George Town / Broadway Branch', type: 'HUB' },
          { name: 'Guindy Industrial Estate Main Hub', type: 'HUB' },
          { name: 'Tambaram Sanatorium Main Hub (GST Rd)', type: 'HUB' },
          { name: 'Ambattur OT / Industrial Estate Hub', type: 'HUB' },
          { name: 'T. Nagar / Usman Road Branch', type: 'BRANCH' },
          { name: 'Kodambakkam / Vadapalani Branch', type: 'BRANCH' },
          { name: 'Egmore / Central Railway Hub', type: 'BRANCH' },
          { name: 'Royapettah / Mylapore Branch', type: 'BRANCH' },
          { name: 'Adyar / Thiruvanmiyur Branch', type: 'BRANCH' },
          { name: 'Velachery Main Road Branch', type: 'BRANCH' },
          { name: 'Chromepet / Pallavaram GST Rd Branch', type: 'BRANCH' },
          { name: 'Porur Junction / Trunk Rd Branch', type: 'BRANCH' },
          { name: 'Poonamallee High Road Branch', type: 'BRANCH' },
          { name: 'Anna Nagar West / Roundtana Branch', type: 'BRANCH' },
          { name: 'Perambur / Kolathur Branch', type: 'BRANCH' },
          { name: 'Madhavaram / Redhills GNT Rd Hub', type: 'HUB' },
          { name: 'Sholinganallur / OMR IT Corridor Branch', type: 'BRANCH' },
          { name: 'Thoraipakkam OMR Branch', type: 'BRANCH' },
          { name: 'Medavakkam / Perumbakkam Branch', type: 'BRANCH' },
          { name: 'Manali / Ennore Industrial Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Madurai',
        branches: [
          { name: 'Mattuthavani Main Central Parcel Hub', type: 'HUB' },
          { name: 'Simmakkal / North Veli Street Branch', type: 'HUB' },
          { name: 'Periyar Bus Stand / Crime Branch Rd', type: 'BRANCH' },
          { name: 'Thirumangalam Main Town Branch', type: 'HUB' },
          { name: 'Usilampatti Town Branch', type: 'BRANCH' },
          { name: 'Melur Main Road Branch', type: 'BRANCH' },
          { name: 'Vadipatti Dindigul NH Branch', type: 'BRANCH' },
          { name: 'Sholavandan Branch', type: 'BRANCH' },
          { name: 'Othakadai High Road Branch', type: 'BRANCH' },
          { name: 'Tirupparankundram Branch', type: 'BRANCH' },
          { name: 'Alanganallur Branch', type: 'BRANCH' },
          { name: 'Palanganatham Bypass Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Dindigul',
        branches: [
          { name: 'Dindigul Central Hub (Salai Road)', type: 'HUB' },
          { name: 'Dindigul Bus Stand / Bypass Branch', type: 'BRANCH' },
          { name: 'Palani Main Town Hub (Adivaram Rd)', type: 'HUB' },
          { name: 'Oddanchatram Vegetable Market Hub', type: 'HUB' },
          { name: 'Batlagundu Main Town Branch', type: 'BRANCH' },
          { name: 'Natham Town Branch', type: 'BRANCH' },
          { name: 'Nilakkottai Branch', type: 'BRANCH' },
          { name: 'Vedasandur NH Branch', type: 'BRANCH' },
          { name: 'Kodaikanal Ghat Road Agency', type: 'AGENCY' },
          { name: 'Gujiliamparai Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Tiruchirappalli',
        branches: [
          { name: 'Trichy Central Hub (Palakkarai / Madurai Rd)', type: 'HUB' },
          { name: 'Trichy Central Bus Stand / Cantonment', type: 'HUB' },
          { name: 'Thillai Nagar Main Road Branch', type: 'BRANCH' },
          { name: 'Srirangam Gandhi Road Branch', type: 'BRANCH' },
          { name: 'Manapparai Town Main Branch', type: 'HUB' },
          { name: 'Thuraiyur Town Main Branch', type: 'BRANCH' },
          { name: 'Musiri Town Branch', type: 'BRANCH' },
          { name: 'Lalgudi Town Branch', type: 'BRANCH' },
          { name: 'Tiruverumbur / BHEL Industrial Branch', type: 'BRANCH' },
          { name: 'Manachanallur Branch', type: 'BRANCH' },
          { name: 'Thottiyam Branch', type: 'BRANCH' },
          { name: 'Navalpattu IT Park Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Thanjavur',
        branches: [
          { name: 'Thanjavur Old Bus Stand Central Hub', type: 'HUB' },
          { name: 'Thanjavur New Bus Stand / Medical College Rd', type: 'BRANCH' },
          { name: 'Kumbakonam Central Town Hub (TSR Big St)', type: 'HUB' },
          { name: 'Pattukkottai Main Town Branch', type: 'HUB' },
          { name: 'Peravurani Town Branch', type: 'BRANCH' },
          { name: 'Thiruvaiyaru Town Branch', type: 'BRANCH' },
          { name: 'Orathanadu Town Branch', type: 'BRANCH' },
          { name: 'Papanasam Main Branch', type: 'BRANCH' },
          { name: 'Budalur Agency', type: 'AGENCY' },
          { name: 'Adirampattinam Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Karur',
        branches: [
          { name: 'Karur Central Main Hub (Jawahar Bazaar / Covai Rd)', type: 'HUB' },
          { name: 'Karur Bus Stand / Bypass Road Branch', type: 'BRANCH' },
          { name: 'Kulithalai Town Main Branch', type: 'BRANCH' },
          { name: 'Aravakurichi Town Branch', type: 'BRANCH' },
          { name: 'Pallapatti Main Branch', type: 'BRANCH' },
          { name: 'Velayuthampalayam / TNPL Branch', type: 'BRANCH' },
          { name: 'Mayanur Branch', type: 'BRANCH' },
          { name: 'Krishnarayapuram Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Vellore',
        branches: [
          { name: 'Vellore Central Hub (Makkan / Officers Line)', type: 'HUB' },
          { name: 'Vellore New Bus Stand / Green Circle', type: 'BRANCH' },
          { name: 'Katpadi Railway Station Road Branch', type: 'HUB' },
          { name: 'Gudiyatham Town Main Branch', type: 'HUB' },
          { name: 'Pernambut Town Branch', type: 'BRANCH' },
          { name: 'Anaicut Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Tiruvannamalai',
        branches: [
          { name: 'Tiruvannamalai Town Main Hub (Polur Rd / Girivalam)', type: 'HUB' },
          { name: 'Tiruvannamalai Bus Stand Branch', type: 'BRANCH' },
          { name: 'Arani Main Silk City Hub', type: 'HUB' },
          { name: 'Cheyyar Town Main Branch', type: 'BRANCH' },
          { name: 'Polur Town Branch', type: 'BRANCH' },
          { name: 'Vandavasi Town Branch', type: 'BRANCH' },
          { name: 'Chengam Town Branch', type: 'BRANCH' },
          { name: 'Kalasapakkam Agency', type: 'AGENCY' },
          { name: 'Kilpennathur Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Cuddalore',
        branches: [
          { name: 'Cuddalore OT Main Central Hub', type: 'HUB' },
          { name: 'Cuddalore Port / Beach Road Branch', type: 'BRANCH' },
          { name: 'Panruti Main Cashew Town Hub', type: 'HUB' },
          { name: 'Chidambaram Main Temple Town Hub', type: 'HUB' },
          { name: 'Neyveli Township Central Hub (Block 24)', type: 'HUB' },
          { name: 'Vridhachalam Main Town Branch', type: 'HUB' },
          { name: 'Tittakudi Town Branch', type: 'BRANCH' },
          { name: 'Kurinjipadi Branch', type: 'BRANCH' },
          { name: 'Kattumannarkoil Branch', type: 'BRANCH' },
          { name: 'Bhuvanagiri Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Villupuram',
        branches: [
          { name: 'Villupuram Central Main Hub (Old Bus Stand)', type: 'HUB' },
          { name: 'Villupuram NH Bypass / Master Plan Complex', type: 'BRANCH' },
          { name: 'Tindivanam Main GST Road Hub', type: 'HUB' },
          { name: 'Gingee Fort Town Branch', type: 'BRANCH' },
          { name: 'Vikravandi NH Branch', type: 'BRANCH' },
          { name: 'Vanur / Auroville Road Branch', type: 'BRANCH' },
          { name: 'Marakkanam ECR Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Kallakurichi',
        branches: [
          { name: 'Kallakurichi Town Central Hub (Salem Main Rd)', type: 'HUB' },
          { name: 'Ulundurpet NH Tollgate Hub', type: 'HUB' },
          { name: 'Sankarapuram Town Branch', type: 'BRANCH' },
          { name: 'Tirukoilur Town Main Branch', type: 'BRANCH' },
          { name: 'Chinnasalem Main Branch', type: 'BRANCH' },
          { name: 'Rishivandiyam Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Theni',
        branches: [
          { name: 'Theni Central Main Hub (Madurai Road)', type: 'HUB' },
          { name: 'Periyakulam Town Main Branch', type: 'BRANCH' },
          { name: 'Bodinayakanur Cardamom City Branch', type: 'HUB' },
          { name: 'Cumbum Valley Town Branch', type: 'BRANCH' },
          { name: 'Chinnamanur Town Branch', type: 'BRANCH' },
          { name: 'Uthamapalayam Branch', type: 'BRANCH' },
          { name: 'Andipatti Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Virudhunagar',
        branches: [
          { name: 'Virudhunagar Central Main Hub (Madurai Rd)', type: 'HUB' },
          { name: 'Sivakasi Central Fireworks Hub (NRKR Rd)', type: 'HUB' },
          { name: 'Rajapalayam Cotton City Hub (Tenkasi Rd)', type: 'HUB' },
          { name: 'Aruppukkottai Town Main Branch', type: 'BRANCH' },
          { name: 'Sattur Town Branch', type: 'BRANCH' },
          { name: 'Srivilliputhur Town Branch', type: 'BRANCH' },
          { name: 'Watrap Branch', type: 'BRANCH' },
          { name: 'Kariapatti Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Tirunelveli',
        branches: [
          { name: 'Tirunelveli Junction Central Mega Hub', type: 'HUB' },
          { name: 'Palayamkottai Bus Stand / High Ground', type: 'BRANCH' },
          { name: 'Tirunelveli Town / Swami Sannathi Branch', type: 'BRANCH' },
          { name: 'Ambasamudram Town Main Branch', type: 'HUB' },
          { name: 'Cheranmahadevi Town Branch', type: 'BRANCH' },
          { name: 'Vallioor Main NH Hub', type: 'HUB' },
          { name: 'Radhapuram Town Branch', type: 'BRANCH' },
          { name: 'Nanguneri Branch', type: 'BRANCH' },
          { name: 'Kalakkad Branch', type: 'BRANCH' },
          { name: 'Tisayanvilai Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Tenkasi',
        branches: [
          { name: 'Tenkasi Central Main Hub (Kasi Viswanathar Rd)', type: 'HUB' },
          { name: 'Sankarankovil Town Main Hub', type: 'HUB' },
          { name: 'Kadayanallur Town Branch', type: 'BRANCH' },
          { name: 'Sengottai Border Hub', type: 'BRANCH' },
          { name: 'Alangulam Town Branch', type: 'BRANCH' },
          { name: 'Surandai Town Branch', type: 'BRANCH' },
          { name: 'Puliangudi Main Branch', type: 'BRANCH' },
          { name: 'Pavoorchatram Branch', type: 'BRANCH' },
          { name: 'Vasudevanallur Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Thoothukudi',
        branches: [
          { name: 'Tuticorin Central Port Hub (Great Cotton Rd)', type: 'HUB' },
          { name: 'Tuticorin Old Bus Stand Branch', type: 'BRANCH' },
          { name: 'Kovilpatti Central Town Hub (Main Rd)', type: 'HUB' },
          { name: 'Tiruchendur Temple Town Branch', type: 'HUB' },
          { name: 'Kayalpattinam Branch', type: 'BRANCH' },
          { name: 'Sathankulam Branch', type: 'BRANCH' },
          { name: 'Vilathikulam Branch', type: 'BRANCH' },
          { name: 'Srivaikuntam Branch', type: 'BRANCH' },
          { name: 'Udangudi Branch', type: 'BRANCH' },
          { name: 'Ettayapuram Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Kanyakumari',
        branches: [
          { name: 'Nagercoil Central Main Hub (Cape Road)', type: 'HUB' },
          { name: 'Nagercoil Vadasery Bus Stand Branch', type: 'BRANCH' },
          { name: 'Marthandam Main Town Hub (NH 66)', type: 'HUB' },
          { name: 'Thuckalay Town Main Branch', type: 'BRANCH' },
          { name: 'Kanyakumari Beach Road Branch', type: 'BRANCH' },
          { name: 'Colachel Port Town Branch', type: 'BRANCH' },
          { name: 'Karungal Town Branch', type: 'BRANCH' },
          { name: 'Kulasekharam Branch', type: 'BRANCH' },
          { name: 'Kuzhithurai / Kaliyakkavilai Branch', type: 'BRANCH' },
          { name: 'Eraniel Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Pudukkottai',
        branches: [
          { name: 'Pudukkottai Town Central Hub (Santhai Rd)', type: 'HUB' },
          { name: 'Aranthangi Main Town Hub', type: 'HUB' },
          { name: 'Alangudi Town Branch', type: 'BRANCH' },
          { name: 'Viralimalai NH Industrial Branch', type: 'BRANCH' },
          { name: 'Gandarvakottai Branch', type: 'BRANCH' },
          { name: 'Thirumayam Historic Town Branch', type: 'BRANCH' },
          { name: 'Ponnamaravathi Branch', type: 'BRANCH' },
          { name: 'Avudaiyarkoil Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Sivaganga',
        branches: [
          { name: 'Karaikudi Central Main Hub (College Rd)', type: 'HUB' },
          { name: 'Sivaganga Town Main Hub (Madurai Rd)', type: 'HUB' },
          { name: 'Devakottai Town Main Branch', type: 'BRANCH' },
          { name: 'Manamadurai Pottery Town Branch', type: 'BRANCH' },
          { name: 'Tirupattur (Sivaganga) Branch', type: 'BRANCH' },
          { name: 'Singampunari Branch', type: 'BRANCH' },
          { name: 'Ilayangudi Branch', type: 'BRANCH' },
          { name: 'Kalayarkoil Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Ramanathapuram',
        branches: [
          { name: 'Ramanathapuram Central Town Hub (Vandikaran St)', type: 'HUB' },
          { name: 'Rameswaram Island Town Hub', type: 'HUB' },
          { name: 'Paramakudi Town Main Branch', type: 'HUB' },
          { name: 'Kilakarai Town Branch', type: 'BRANCH' },
          { name: 'Mudukulathur Branch', type: 'BRANCH' },
          { name: 'Kamuthi Town Branch', type: 'BRANCH' },
          { name: 'Sayalgudi Agency', type: 'AGENCY' },
          { name: 'RS Mangalam Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Ariyalur',
        branches: [
          { name: 'Ariyalur Town Main Central Hub', type: 'HUB' },
          { name: 'Jayankondam Main Town Branch', type: 'HUB' },
          { name: 'Sendurai Town Branch', type: 'BRANCH' },
          { name: 'Udayarpalayam Branch', type: 'BRANCH' },
          { name: 'Andimadam Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Perambalur',
        branches: [
          { name: 'Perambalur Town Main Central Hub (Trichy NH)', type: 'HUB' },
          { name: 'Veppanthattai Branch', type: 'BRANCH' },
          { name: 'Kunnam Town Branch', type: 'BRANCH' },
          { name: 'Alathur / Padalur Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Nagapattinam',
        branches: [
          { name: 'Nagapattinam Town Central Port Hub', type: 'HUB' },
          { name: 'Velankanni Pilgrim Town Branch', type: 'HUB' },
          { name: 'Vedaranyam Town Branch', type: 'BRANCH' },
          { name: 'Kilvelur Branch', type: 'BRANCH' },
          { name: 'Thirukuvalai Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Mayiladuthurai',
        branches: [
          { name: 'Mayiladuthurai Central Town Hub (Katchery Rd)', type: 'HUB' },
          { name: 'Sirkazhi Main Town Branch', type: 'HUB' },
          { name: 'Tharangambadi Coastal Branch', type: 'BRANCH' },
          { name: 'Kuthalam Town Branch', type: 'BRANCH' },
          { name: 'Poompuhar Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Tiruvarur',
        branches: [
          { name: 'Tiruvarur Town Central Hub (South Main St)', type: 'HUB' },
          { name: 'Mannargudi Central Town Hub (Big Temple St)', type: 'HUB' },
          { name: 'Thiruthuraipoondi Town Branch', type: 'BRANCH' },
          { name: 'Nannilam Town Branch', type: 'BRANCH' },
          { name: 'Kodavasal Town Branch', type: 'BRANCH' },
          { name: 'Valangaiman Branch', type: 'BRANCH' },
          { name: 'Needamangalam Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Ranipet',
        branches: [
          { name: 'Ranipet / Walajapet Central Industrial Hub', type: 'HUB' },
          { name: 'Arcot Main Town Branch', type: 'HUB' },
          { name: 'Arakkonam Junction Mega Hub', type: 'HUB' },
          { name: 'Sholinghur Temple Town Branch', type: 'BRANCH' },
          { name: 'Nemili Branch', type: 'BRANCH' },
          { name: 'Kaveripakkam Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Tirupattur',
        branches: [
          { name: 'Tirupattur Central Town Hub (Railway Station Rd)', type: 'HUB' },
          { name: 'Vaniyambadi Leather City Hub', type: 'HUB' },
          { name: 'Ambur Main Central Hub (MC Road)', type: 'HUB' },
          { name: 'Jolarpettai Junction Branch', type: 'BRANCH' },
          { name: 'Natrampalli Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Chengalpattu',
        branches: [
          { name: 'Chengalpattu Town Central Hub (GST Road)', type: 'HUB' },
          { name: 'Maraimalai Nagar Industrial Hub', type: 'HUB' },
          { name: 'Tambaram East / Camp Road Branch', type: 'HUB' },
          { name: 'Guduvanchery GST Road Branch', type: 'BRANCH' },
          { name: 'Maduranthakam Town Branch', type: 'BRANCH' },
          { name: 'Thiruporur OMR Branch', type: 'BRANCH' },
          { name: 'Kelambakkam OMR / ECR Branch', type: 'BRANCH' },
          { name: 'Mamallapuram ECR Tourist Branch', type: 'BRANCH' },
          { name: 'Cheyyur Coastal Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Kanchipuram',
        branches: [
          { name: 'Kanchipuram Central Silk City Hub (Gandhi Rd)', type: 'HUB' },
          { name: 'Sriperumbudur Mega Industrial Hub (NH 4)', type: 'HUB' },
          { name: 'Walajabad Town Branch', type: 'BRANCH' },
          { name: 'Uthiramerur Town Branch', type: 'BRANCH' },
          { name: 'Kundrathur Main Road Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Tiruvallur',
        branches: [
          { name: 'Tiruvallur Town Central Hub (Jail St)', type: 'HUB' },
          { name: 'Avadi CTH Road Central Hub', type: 'HUB' },
          { name: 'Poonamallee Trunk Road Hub', type: 'HUB' },
          { name: 'Ponneri Town Branch', type: 'BRANCH' },
          { name: 'Gummidipoondi SIPCOT Industrial Hub', type: 'HUB' },
          { name: 'Thiruttani Temple Town Hub', type: 'BRANCH' },
          { name: 'Minjur Port Road Branch', type: 'BRANCH' },
          { name: 'Ambattur Industrial Estate Hub', type: 'HUB' },
          { name: 'Uthukkottai Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'The Nilgiris',
        branches: [
          { name: 'Mettupalayam Junction Gateway Hub', type: 'HUB' },
          { name: 'Coonoor Main Town Branch (Mount Rd)', type: 'BRANCH' },
          { name: 'Ooty / Udhagamandalam Town Hub (Commercial Rd)', type: 'HUB' },
          { name: 'Kotagiri Main Town Branch', type: 'BRANCH' },
          { name: 'Gudalur Town Border Branch', type: 'BRANCH' }
        ]
      }
    ]
  },
  {
    state: 'Karnataka',
    districts: [
      {
        district: 'Bengaluru Urban / Rural',
        branches: [
          { name: 'Kalasipalya Central Mega Hub (City Market)', type: 'HUB' },
          { name: 'Peenya Industrial Area Mega Hub (1st Stage)', type: 'HUB' },
          { name: 'Yeshwanthpur APMC Yard Branch', type: 'HUB' },
          { name: 'Bommasandra / Electronic City Hub (Hosur Rd)', type: 'HUB' },
          { name: 'KR Puram / Whitefield Old Madras Rd Branch', type: 'BRANCH' },
          { name: 'Majestic / Kempegowda Bus Station Branch', type: 'BRANCH' },
          { name: 'Jayanagar 4th Block Branch', type: 'BRANCH' },
          { name: 'Rajajinagar Industrial Town Branch', type: 'BRANCH' },
          { name: 'Yelahanka New Town / BB Road Branch', type: 'BRANCH' },
          { name: 'Kengeri Satellite Town / Mysore Rd Branch', type: 'BRANCH' },
          { name: 'Bannerghatta Road / Arekere Branch', type: 'BRANCH' },
          { name: 'Hebbal / Bellary Road Branch', type: 'BRANCH' },
          { name: 'Marathahalli Outer Ring Road Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Mysuru',
        branches: [
          { name: 'Mysuru City Central Hub (Sayyaji Rao Rd)', type: 'HUB' },
          { name: 'Mysuru Lashkar Mohalla / Suburb Bus Stand', type: 'BRANCH' },
          { name: 'Mandya Town Main Branch (Bengaluru-Mysore Hwy)', type: 'HUB' },
          { name: 'Nanjangud Industrial Town Branch', type: 'BRANCH' },
          { name: 'Hunsur Town Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Chamarajanagar',
        branches: [
          { name: 'Chamarajanagar Town Main Hub', type: 'HUB' },
          { name: 'Kollegal Silk Town Branch', type: 'BRANCH' },
          { name: 'Gundlupet Kerala-TN Border Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Kolar / Hosakote',
        branches: [
          { name: 'Hosakote Industrial Gateway Hub', type: 'HUB' },
          { name: 'Kolar Town Central Branch', type: 'BRANCH' },
          { name: 'Robertsonpet / KGF Branch', type: 'BRANCH' },
          { name: 'Malur Industrial Branch', type: 'BRANCH' }
        ]
      }
    ]
  },
  {
    state: 'Puducherry',
    districts: [
      {
        district: 'Puducherry',
        branches: [
          { name: 'Puducherry Central Main Hub (Maraimalai Adigal Salai)', type: 'HUB' },
          { name: 'Puducherry Boulevard / JN Street Branch', type: 'BRANCH' },
          { name: 'Villianur Main Town Branch', type: 'BRANCH' },
          { name: 'Lawspet Airport Road Branch', type: 'BRANCH' },
          { name: 'Bahour Agency', type: 'AGENCY' }
        ]
      },
      {
        district: 'Karaikal',
        branches: [
          { name: 'Karaikal Town Main Central Hub (Bharathiyar St)', type: 'HUB' },
          { name: 'Tirumalairayanpattinam Branch', type: 'BRANCH' }
        ]
      }
    ]
  },
  {
    state: 'Kerala',
    districts: [
      {
        district: 'Palakkad',
        branches: [
          { name: 'Palakkad Central Town Hub (GB Road)', type: 'HUB' },
          { name: 'Walayar Interstate Border Hub', type: 'HUB' },
          { name: 'Chittur Town Branch', type: 'BRANCH' },
          { name: 'Ottapalam Town Branch', type: 'BRANCH' },
          { name: 'Mannarkkad Town Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Thrissur',
        branches: [
          { name: 'Thrissur Central Cultural Capital Hub (Kokkala)', type: 'HUB' },
          { name: 'Chalakudy Main NH Branch', type: 'BRANCH' },
          { name: 'Kunnamkulam Town Branch', type: 'BRANCH' },
          { name: 'Wadakkanchery Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Ernakulam / Kochi',
        branches: [
          { name: 'Kaloor / Ernakulam Central Hub', type: 'HUB' },
          { name: 'Aluva Railway Station Rd Branch', type: 'BRANCH' },
          { name: 'Angamaly Main NH Branch', type: 'BRANCH' },
          { name: 'Tripunithura Town Branch', type: 'BRANCH' }
        ]
      }
    ]
  },
  {
    state: 'Andhra Pradesh',
    districts: [
      {
        district: 'Chittoor',
        branches: [
          { name: 'Chittoor Town Main Central Hub (High Road)', type: 'HUB' },
          { name: 'Kuppam Border Town Branch (PES Medical Rd)', type: 'HUB' },
          { name: 'Palamaner NH Branch', type: 'BRANCH' },
          { name: 'Nagari Town Branch', type: 'BRANCH' },
          { name: 'Puttur Town Branch', type: 'BRANCH' }
        ]
      },
      {
        district: 'Tirupati',
        branches: [
          { name: 'Tirupati Central Temple City Hub (TPT-Renigunta Rd)', type: 'HUB' },
          { name: 'Renigunta Junction Branch', type: 'BRANCH' },
          { name: 'Srikalahasti Temple Town Branch', type: 'BRANCH' }
        ]
      }
    ]
  }
];

export function getMetturStateCoverage(stateName: string): MetturDistrict[] {
  const norm = (stateName || '').toLowerCase().trim();
  const match = METTUR_PARCEL_COVERAGE.find(s => s.state.toLowerCase() === norm);
  return match?.districts || [];
}

export function isMetturServiceAvailable(stateName: string, districtName?: string): boolean {
  const normState = (stateName || '').toLowerCase().trim();
  const stateMatch = METTUR_PARCEL_COVERAGE.find(s => s.state.toLowerCase() === normState);
  if (!stateMatch) return false;
  if (!districtName || !districtName.trim()) return true;

  const normDist = districtName.toLowerCase().trim();
  return stateMatch.districts.some(d =>
    d.district.toLowerCase() === normDist ||
    normDist.includes(d.district.toLowerCase()) ||
    d.district.toLowerCase().includes(normDist)
  );
}

export function getBranchesForDistrict(stateName: string, districtName: string): MetturBranch[] {
  const districts = getMetturStateCoverage(stateName);
  const normDist = (districtName || '').toLowerCase().trim();
  const found = districts.find(d =>
    d.district.toLowerCase() === normDist ||
    normDist.includes(d.district.toLowerCase()) ||
    d.district.toLowerCase().includes(normDist)
  );
  return found?.branches || [];
}
