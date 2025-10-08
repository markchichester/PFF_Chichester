// Google Sheets API Configuration
const GOOGLE_SHEETS_ID = '1OK7cdiJtVjQYQhJNFovBoBnIodz77u6uH1eGOMWUxCM'; // Your Google Sheets ID
const API_KEY = 'AIzaSyCwM54xdN1uSUC_kJuv9GU1nvizR1ZLGuk'; // Your API key

// Sample data structure (replace with actual Google Sheets data)
const sampleData = {
    QB: [
        {
            name: "Josh Allen",
            team: "Buffalo Bills",
            PFF_WAR: 1,
            pffGrade: 92.5,
            snaps: 1087,
            pffGradeRank: 1,
            facetGrade1: 94.2, // Passing Grade
            facetGrade2: 89.8, // Rushing Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Allen continues to dominate with his dual-threat ability and improved accuracy. His 92.5 PFF grade reflects his elite decision-making and arm talent."
        },
        {
            name: "Lamar Jackson",
            team: "Baltimore Ravens",
            PFF_WAR: 2,
            pffGrade: 91.8,
            snaps: 1023,
            pffGradeRank: 2,
            facetGrade1: 93.1, // Passing Grade
            facetGrade2: 88.5, // Rushing Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Jackson's mobility and improved passing have made him nearly unstoppable. His 91.8 grade shows his evolution as a complete quarterback."
        },
        {
            name: "Dak Prescott",
            team: "Dallas Cowboys",
            PFF_WAR: 3,
            pffGrade: 89.2,
            snaps: 1156,
            pffGradeRank: 3,
            facetGrade1: 90.1, // Passing Grade
            facetGrade2: 87.3, // Rushing Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Prescott's consistency and leadership have been key to Dallas's success. His 89.2 grade reflects his steady improvement in all facets."
        },
        {
            name: "Tua Tagovailoa",
            team: "Miami Dolphins",
            PFF_WAR: 4,
            pffGrade: 87.6,
            snaps: 1098,
            pffGradeRank: 4,
            facetGrade1: 88.9, // Passing Grade
            facetGrade2: 85.2, // Rushing Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Tua's accuracy and quick release have been instrumental in Miami's high-powered offense. His 87.6 grade shows his growth as a passer."
        },
        {
            name: "Brock Purdy",
            team: "San Francisco 49ers",
            PFF_WAR: 5,
            pffGrade: 86.3,
            snaps: 1123,
            pffGradeRank: 5,
            facetGrade1: 87.1, // Passing Grade
            facetGrade2: 84.5, // Rushing Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Purdy's efficiency and game management continue to impress. His 86.3 grade reflects his ability to maximize the 49ers' offensive system."
        }
    ],
    HB: [
        {
            name: "Christian McCaffrey",
            team: "San Francisco 49ers",
            PFF_WAR: 1,
            pffGrade: 94.1,
            snaps: 847,
            pffGradeRank: 1,
            facetGrade1: 95.3, // Rushing Grade
            facetGrade2: 91.8, // Receiving Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "McCaffrey's versatility and elite vision make him the complete running back. His 94.1 grade reflects his dominance in all phases."
        },
        {
            name: "Derrick Henry",
            team: "Tennessee Titans",
            PFF_WAR: 2,
            pffGrade: 91.7,
            snaps: 923,
            pffGradeRank: 2,
            facetGrade1: 92.8, // Rushing Grade
            facetGrade2: 89.6, // Receiving Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Henry's power and durability continue to set him apart. His 91.7 grade shows his ability to wear down defenses."
        },
        {
            name: "Saquon Barkley",
            team: "New York Giants",
            PFF_WAR: 3,
            pffGrade: 89.4,
            snaps: 789,
            pffGradeRank: 3,
            facetGrade1: 90.2, // Rushing Grade
            facetGrade2: 87.6, // Receiving Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Barkley's explosiveness and receiving ability make him a dual threat. His 89.4 grade reflects his all-around excellence."
        },
        {
            name: "Nick Chubb",
            team: "Cleveland Browns",
            PFF_WAR: 4,
            pffGrade: 87.9,
            snaps: 834,
            pffGradeRank: 4,
            facetGrade1: 88.7, // Rushing Grade
            facetGrade2: 86.1, // Receiving Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Chubb's vision and power running style continue to be effective. His 87.9 grade shows his consistency and reliability."
        },
        {
            name: "Josh Jacobs",
            team: "Las Vegas Raiders",
            PFF_WAR: 5,
            pffGrade: 86.2,
            snaps: 912,
            pffGradeRank: 5,
            facetGrade1: 87.4, // Rushing Grade
            facetGrade2: 84.0, // Receiving Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Jacobs' toughness and ability to break tackles make him a valuable asset. His 86.2 grade reflects his hard-nosed running style."
        }
    ],
    WR: [
        {
            name: "Tyreek Hill",
            team: "Miami Dolphins",
            PFF_WAR: 1,
            pffGrade: 93.2,
            snaps: 1024,
            pffGradeRank: 1,
            facetGrade1: 94.8, // Receiving Grade
            facetGrade2: 78.5, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Hill's speed and route running make him nearly impossible to cover. His 93.2 grade reflects his elite receiving ability and big-play potential."
        },
        {
            name: "Davante Adams",
            team: "Las Vegas Raiders",
            PFF_WAR: 2,
            pffGrade: 91.5,
            snaps: 1089,
            pffGradeRank: 2,
            facetGrade1: 92.1, // Receiving Grade
            facetGrade2: 82.3, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Adams' precision routes and reliable hands make him a quarterback's best friend. His 91.5 grade shows his consistency and technical excellence."
        },
        {
            name: "Cooper Kupp",
            team: "Los Angeles Rams",
            PFF_WAR: 3,
            pffGrade: 89.8,
            snaps: 956,
            pffGradeRank: 3,
            facetGrade1: 90.4, // Receiving Grade
            facetGrade2: 79.8, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Kupp's versatility and football IQ make him a complete receiver. His 89.8 grade reflects his ability to excel in all aspects of the position."
        },
        {
            name: "Stefon Diggs",
            team: "Buffalo Bills",
            PFF_WAR: 4,
            pffGrade: 88.3,
            snaps: 1034,
            pffGradeRank: 4,
            facetGrade1: 89.1, // Receiving Grade
            facetGrade2: 76.9, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Diggs' route running and contested catch ability make him a reliable target. His 88.3 grade shows his consistency and big-play capability."
        },
        {
            name: "A.J. Brown",
            team: "Philadelphia Eagles",
            PFF_WAR: 5,
            pffGrade: 87.1,
            snaps: 987,
            pffGradeRank: 5,
            facetGrade1: 88.7, // Receiving Grade
            facetGrade2: 75.2, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Brown's physicality and after-catch ability make him a nightmare for defenses. His 87.1 grade reflects his power and playmaking skills."
        }
    ],
    TE: [
        {
            name: "Travis Kelce",
            team: "Kansas City Chiefs",
            PFF_WAR: 1,
            pffGrade: 92.4,
            snaps: 1087,
            pffGradeRank: 1,
            facetGrade1: 93.8, // Receiving Grade
            facetGrade2: 84.2, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Kelce's route running and chemistry with Mahomes make him the gold standard at tight end. His 92.4 grade reflects his elite receiving skills."
        },
        {
            name: "George Kittle",
            team: "San Francisco 49ers",
            PFF_WAR: 2,
            pffGrade: 90.7,
            snaps: 1023,
            pffGradeRank: 2,
            facetGrade1: 89.3, // Receiving Grade
            facetGrade2: 91.8, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Kittle's combination of receiving ability and elite blocking makes him the most complete tight end. His 90.7 grade shows his versatility."
        },
        {
            name: "Mark Andrews",
            team: "Baltimore Ravens",
            PFF_WAR: 3,
            pffGrade: 88.9,
            snaps: 1156,
            pffGradeRank: 3,
            facetGrade1: 90.1, // Receiving Grade
            facetGrade2: 82.4, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Andrews' reliable hands and red zone presence make him a valuable target. His 88.9 grade reflects his consistency and reliability."
        },
        {
            name: "T.J. Hockenson",
            team: "Minnesota Vikings",
            PFF_WAR: 4,
            pffGrade: 87.2,
            snaps: 1098,
            pffGradeRank: 4,
            facetGrade1: 88.7, // Receiving Grade
            facetGrade2: 79.8, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Hockenson's athleticism and route running make him a matchup nightmare. His 87.2 grade shows his growth as a complete tight end."
        },
        {
            name: "Kyle Pitts",
            team: "Atlanta Falcons",
            PFF_WAR: 5,
            pffGrade: 85.8,
            snaps: 1123,
            pffGradeRank: 5,
            facetGrade1: 87.4, // Receiving Grade
            facetGrade2: 78.1, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Pitts' rare combination of size and speed makes him a unique weapon. His 85.8 grade reflects his potential and athletic gifts."
        }
    ],
    'T/G/C': [
        {
            name: "Trent Williams",
            team: "San Francisco 49ers",
            PFF_WAR: 1,
            pffGrade: 94.7,
            snaps: 1087,
            pffGradeRank: 1,
            facetGrade1: 95.2, // Pass-blocking Grade
            facetGrade2: 93.8, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Williams' combination of power and athleticism makes him the premier offensive tackle. His 94.7 grade reflects his dominance in both phases."
        },
        {
            name: "Quenton Nelson",
            team: "Indianapolis Colts",
            PFF_WAR: 2,
            pffGrade: 92.1,
            snaps: 1023,
            pffGradeRank: 2,
            facetGrade1: 90.8, // Pass-blocking Grade
            facetGrade2: 94.5, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Nelson's power and technique make him the gold standard at guard. His 92.1 grade shows his excellence in both pass and run blocking."
        },
        {
            name: "Jason Kelce",
            team: "Philadelphia Eagles",
            PFF_WAR: 3,
            pffGrade: 89.4,
            snaps: 1156,
            pffGradeRank: 3,
            facetGrade1: 88.7, // Pass-blocking Grade
            facetGrade2: 91.2, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Kelce's intelligence and athleticism make him the perfect center. His 89.4 grade reflects his leadership and technical excellence."
        },
        {
            name: "Lane Johnson",
            team: "Philadelphia Eagles",
            PFF_WAR: 4,
            pffGrade: 87.8,
            snaps: 1098,
            pffGradeRank: 4,
            facetGrade1: 89.1, // Pass-blocking Grade
            facetGrade2: 85.9, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Johnson's consistency and technique make him a reliable right tackle. His 87.8 grade shows his steady performance in both phases."
        },
        {
            name: "Zack Martin",
            team: "Dallas Cowboys",
            PFF_WAR: 5,
            pffGrade: 86.3,
            snaps: 1123,
            pffGradeRank: 5,
            facetGrade1: 87.2, // Pass-blocking Grade
            facetGrade2: 88.7, // Run-blocking Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Martin's power and consistency make him a cornerstone of the Cowboys' line. His 86.3 grade reflects his reliability and technique."
        }
    ],
    DI: [
        {
            name: "Aaron Donald",
            team: "Los Angeles Rams",
            PFF_WAR: 1,
            pffGrade: 95.1,
            snaps: 847,
            pffGradeRank: 1,
            facetGrade1: 96.8, // Pass-rush Grade
            facetGrade2: 92.4, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Donald's combination of power and quickness makes him nearly unblockable. His 95.1 grade reflects his dominance in both phases."
        },
        {
            name: "Chris Jones",
            team: "Kansas City Chiefs",
            PFF_WAR: 2,
            pffGrade: 92.7,
            snaps: 923,
            pffGradeRank: 2,
            facetGrade1: 94.2, // Pass-rush Grade
            facetGrade2: 89.8, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Jones' length and power make him a disruptive force inside. His 92.7 grade shows his ability to impact both pass and run games."
        },
        {
            name: "Quinnen Williams",
            team: "New York Jets",
            PFF_WAR: 3,
            pffGrade: 90.3,
            snaps: 789,
            pffGradeRank: 3,
            facetGrade1: 91.8, // Pass-rush Grade
            facetGrade2: 87.6, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Williams' quickness and strength make him a rising star on the interior. His 90.3 grade reflects his growth and potential."
        },
        {
            name: "Jeffery Simmons",
            team: "Tennessee Titans",
            PFF_WAR: 4,
            pffGrade: 88.9,
            snaps: 834,
            pffGradeRank: 4,
            facetGrade1: 89.4, // Pass-rush Grade
            facetGrade2: 88.1, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Simmons' power and motor make him a consistent force. His 88.9 grade shows his ability to impact games in multiple ways."
        },
        {
            name: "Dexter Lawrence",
            team: "New York Giants",
            PFF_WAR: 5,
            pffGrade: 87.2,
            snaps: 912,
            pffGradeRank: 5,
            facetGrade1: 88.7, // Pass-rush Grade
            facetGrade2: 85.4, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Lawrence's size and strength make him a force in the middle. His 87.2 grade reflects his ability to control the line of scrimmage."
        }
    ],
    ED: [
        {
            name: "Myles Garrett",
            team: "Cleveland Browns",
            PFF_WAR: 1,
            pffGrade: 93.8,
            snaps: 1024,
            pffGradeRank: 1,
            facetGrade1: 95.4, // Pass-rush Grade
            facetGrade2: 90.2, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Garrett's combination of speed and power makes him nearly unblockable. His 93.8 grade reflects his dominance as a pass rusher."
        },
        {
            name: "T.J. Watt",
            team: "Pittsburgh Steelers",
            PFF_WAR: 2,
            pffGrade: 91.5,
            snaps: 1089,
            pffGradeRank: 2,
            facetGrade1: 92.8, // Pass-rush Grade
            facetGrade2: 88.7, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Watt's motor and technique make him a consistent force off the edge. His 91.5 grade shows his ability to impact every play."
        },
        {
            name: "Nick Bosa",
            team: "San Francisco 49ers",
            PFF_WAR: 3,
            pffGrade: 89.7,
            snaps: 956,
            pffGradeRank: 3,
            facetGrade1: 91.2, // Pass-rush Grade
            facetGrade2: 86.4, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Bosa's technique and quickness make him a nightmare for tackles. His 89.7 grade reflects his refined pass-rush skills."
        },
        {
            name: "Micah Parsons",
            team: "Dallas Cowboys",
            PFF_WAR: 4,
            pffGrade: 88.1,
            snaps: 1034,
            pffGradeRank: 4,
            facetGrade1: 89.8, // Pass-rush Grade
            facetGrade2: 84.7, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Parsons' versatility and athleticism make him a unique weapon. His 88.1 grade shows his ability to impact games from multiple positions."
        },
        {
            name: "Maxx Crosby",
            team: "Las Vegas Raiders",
            PFF_WAR: 5,
            pffGrade: 86.9,
            snaps: 987,
            pffGradeRank: 5,
            facetGrade1: 88.4, // Pass-rush Grade
            facetGrade2: 83.8, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Crosby's motor and length make him a consistent pass-rush threat. His 86.9 grade reflects his relentless approach to the game."
        }
    ],
    LB: [
        {
            name: "Fred Warner",
            team: "San Francisco 49ers",
            PFF_WAR: 1,
            pffGrade: 92.3,
            snaps: 1087,
            pffGradeRank: 1,
            facetGrade1: 94.1, // Coverage Grade
            facetGrade2: 89.8, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Warner's instincts and athleticism make him the complete linebacker. His 92.3 grade reflects his excellence in both coverage and run defense."
        },
        {
            name: "Roquan Smith",
            team: "Baltimore Ravens",
            PFF_WAR: 2,
            pffGrade: 90.7,
            snaps: 1023,
            pffGradeRank: 2,
            facetGrade1: 91.4, // Coverage Grade
            facetGrade2: 89.2, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Smith's speed and tackling ability make him a force in the middle. His 90.7 grade shows his ability to impact both phases of defense."
        },
        {
            name: "Bobby Wagner",
            team: "Seattle Seahawks",
            PFF_WAR: 3,
            pffGrade: 88.9,
            snaps: 1156,
            pffGradeRank: 3,
            facetGrade1: 87.8, // Coverage Grade
            facetGrade2: 91.2, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Wagner's experience and instincts make him a steady presence. His 88.9 grade reflects his consistency and leadership."
        },
        {
            name: "Darius Leonard",
            team: "Indianapolis Colts",
            PFF_WAR: 4,
            pffGrade: 87.4,
            snaps: 1098,
            pffGradeRank: 4,
            facetGrade1: 88.7, // Coverage Grade
            facetGrade2: 85.8, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Leonard's range and playmaking ability make him a valuable asset. His 87.4 grade shows his ability to create turnovers."
        },
        {
            name: "Lavonte David",
            team: "Tampa Bay Buccaneers",
            PFF_WAR: 5,
            pffGrade: 86.1,
            snaps: 1123,
            pffGradeRank: 5,
            facetGrade1: 87.2, // Coverage Grade
            facetGrade2: 84.7, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "David's consistency and technique make him a reliable linebacker. His 86.1 grade reflects his steady performance over the years."
        }
    ],
    CB: [
        {
            name: "Jalen Ramsey",
            team: "Miami Dolphins",
            PFF_WAR: 1,
            pffGrade: 91.8,
            snaps: 1087,
            pffGradeRank: 1,
            facetGrade1: 93.4, // Coverage Grade
            facetGrade2: 88.7, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Ramsey's combination of size and athleticism makes him nearly impossible to beat. His 91.8 grade reflects his lockdown ability."
        },
        {
            name: "Jaire Alexander",
            team: "Green Bay Packers",
            PFF_WAR: 2,
            pffGrade: 89.7,
            snaps: 1023,
            pffGradeRank: 2,
            facetGrade1: 91.2, // Coverage Grade
            facetGrade2: 86.4, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Alexander's quickness and ball skills make him a playmaker. His 89.7 grade shows his ability to create turnovers."
        },
        {
            name: "Marlon Humphrey",
            team: "Baltimore Ravens",
            PFF_WAR: 3,
            pffGrade: 88.3,
            snaps: 1156,
            pffGradeRank: 3,
            facetGrade1: 89.8, // Coverage Grade
            facetGrade2: 85.2, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Humphrey's physicality and technique make him a complete corner. His 88.3 grade reflects his consistency in coverage."
        },
        {
            name: "Xavien Howard",
            team: "Miami Dolphins",
            PFF_WAR: 4,
            pffGrade: 87.1,
            snaps: 1098,
            pffGradeRank: 4,
            facetGrade1: 88.7, // Coverage Grade
            facetGrade2: 83.8, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Howard's ball skills and instincts make him a turnover machine. His 87.1 grade shows his ability to create big plays."
        },
        {
            name: "Stephon Gilmore",
            team: "Dallas Cowboys",
            PFF_WAR: 5,
            pffGrade: 85.9,
            snaps: 1123,
            pffGradeRank: 5,
            facetGrade1: 87.4, // Coverage Grade
            facetGrade2: 82.7, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Gilmore's experience and technique make him a reliable corner. His 85.9 grade reflects his steady performance and leadership."
        }
    ],
    S: [
        {
            name: "Derwin James",
            team: "Los Angeles Chargers",
            PFF_WAR: 1,
            pffGrade: 92.1,
            snaps: 1087,
            pffGradeRank: 1,
            facetGrade1: 93.8, // Coverage Grade
            facetGrade2: 89.7, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "James' versatility and athleticism make him the complete safety. His 92.1 grade reflects his ability to impact all phases of defense."
        },
        {
            name: "Minkah Fitzpatrick",
            team: "Pittsburgh Steelers",
            PFF_WAR: 2,
            pffGrade: 90.4,
            snaps: 1023,
            pffGradeRank: 2,
            facetGrade1: 91.7, // Coverage Grade
            facetGrade2: 87.8, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Fitzpatrick's instincts and ball skills make him a playmaker. His 90.4 grade shows his ability to create turnovers and big plays."
        },
        {
            name: "Kevin Byard",
            team: "Philadelphia Eagles",
            PFF_WAR: 3,
            pffGrade: 88.7,
            snaps: 1156,
            pffGradeRank: 3,
            facetGrade1: 89.4, // Coverage Grade
            facetGrade2: 87.2, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Byard's intelligence and range make him a reliable safety. His 88.7 grade reflects his consistency and leadership."
        },
        {
            name: "Budda Baker",
            team: "Arizona Cardinals",
            PFF_WAR: 4,
            pffGrade: 87.3,
            snaps: 1098,
            pffGradeRank: 4,
            facetGrade1: 88.1, // Coverage Grade
            facetGrade2: 85.8, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Baker's speed and tackling ability make him a force in the secondary. His 87.3 grade shows his impact in both coverage and run support."
        },
        {
            name: "Harrison Smith",
            team: "Minnesota Vikings",
            PFF_WAR: 5,
            pffGrade: 86.2,
            snaps: 1123,
            pffGradeRank: 5,
            facetGrade1: 87.8, // Coverage Grade
            facetGrade2: 83.9, // Run-defense Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Smith's experience and versatility make him a valuable leader. His 86.2 grade reflects his steady performance and football IQ."
        }
    ],
    K: [
        {
            name: "Justin Tucker",
            team: "Baltimore Ravens",
            PFF_WAR: 1,
            pffGrade: 94.2,
            snaps: 87,
            pffGradeRank: 1,
            facetGrade1: 95.8, // Field Goal Grade
            facetGrade2: 91.4, // Kickoff Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Tucker's accuracy and clutch performance make him the gold standard at kicker. His 94.2 grade reflects his reliability in pressure situations."
        },
        {
            name: "Harrison Butker",
            team: "Kansas City Chiefs",
            PFF_WAR: 2,
            pffGrade: 91.7,
            snaps: 92,
            pffGradeRank: 2,
            facetGrade1: 92.4, // Field Goal Grade
            facetGrade2: 90.1, // Kickoff Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Butker's consistency and range make him a reliable weapon. His 91.7 grade shows his ability to convert from long distance."
        },
        {
            name: "Daniel Carlson",
            team: "Las Vegas Raiders",
            PFF_WAR: 3,
            pffGrade: 89.4,
            snaps: 78,
            pffGradeRank: 3,
            facetGrade1: 90.2, // Field Goal Grade
            facetGrade2: 87.8, // Kickoff Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Carlson's accuracy and mental toughness make him a clutch performer. His 89.4 grade reflects his reliability in key moments."
        },
        {
            name: "Younghoe Koo",
            team: "Atlanta Falcons",
            PFF_WAR: 4,
            pffGrade: 87.8,
            snaps: 85,
            pffGradeRank: 4,
            facetGrade1: 88.7, // Field Goal Grade
            facetGrade2: 86.2, // Kickoff Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "Koo's technique and consistency make him a reliable kicker. His 87.8 grade shows his steady performance throughout the season."
        },
        {
            name: "Evan McPherson",
            team: "Cincinnati Bengals",
            PFF_WAR: 5,
            pffGrade: 86.1,
            snaps: 89,
            pffGradeRank: 5,
            facetGrade1: 87.4, // Field Goal Grade
            facetGrade2: 84.3, // Kickoff Grade
            image: "https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png",
            analysis: "McPherson's clutch gene and accuracy make him a valuable asset. His 86.1 grade reflects his ability to perform under pressure."
        }
    ]
};

// Team color and logo mapping
const teamColors = {
    'Buffalo Bills': '#00338D',
    'Baltimore Ravens': '#241773',
    'Dallas Cowboys': '#003594',
    'Miami Dolphins': '#008E97',
    'San Francisco 49ers': '#AA0000',
    'Tennessee Titans': '#0C2340',
    'New York Giants': '#0B2265',
    'Cleveland Browns': '#311D00',
    'Las Vegas Raiders': '#000000',
    'Atlanta Falcons': '#A71930',
    'Philadelphia Eagles': '#004C54',
    'Green Bay Packers': '#203731',
    'Cincinnati Bengals': '#FB4F14',
    'Los Angeles Chargers': '#0080C6',
    'Washington Commanders': '#5A1414',
    'Seattle Seahawks': '#002244',
    'Detroit Lions': '#0076B6',
    'Minnesota Vikings': '#4F2683',
    'Houston Texans': '#03202F',
    'Arizona Cardinals': '#97233F',
    'Kansas City Chiefs': '#E31837',
    'Los Angeles Rams': '#003594',
    'New York Jets': '#125740',
    'Pittsburgh Steelers': '#FFB612',
    'Tampa Bay Buccaneers': '#D50A0A',
    'Indianapolis Colts': '#002C5F',
    'New Orleans Saints': '#D3BC8D',
    'Carolina Panthers': '#0085CA',
    'Jacksonville Jaguars': '#006778',
    'Denver Broncos': '#FB4F14',
    'Chicago Bears': '#0B162A',
    'New England Patriots': '#002244'
};

const teamLogos = {
    'Buffalo Bills': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
    'Baltimore Ravens': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
    'Dallas Cowboys': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
    'Miami Dolphins': 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
    'San Francisco 49ers': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
    'Tennessee Titans': 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
    'New York Giants': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
    'Cleveland Browns': 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
    'Las Vegas Raiders': 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png',
    'Atlanta Falcons': 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
    'Philadelphia Eagles': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
    'Green Bay Packers': 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
    'Cincinnati Bengals': 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
    'Los Angeles Chargers': 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
    'Washington Commanders': 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png',
    'Seattle Seahawks': 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png',
    'Detroit Lions': 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
    'Minnesota Vikings': 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
    'Houston Texans': 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
    'Arizona Cardinals': 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
    'Kansas City Chiefs': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
    'Los Angeles Rams': 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
    'New York Jets': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
    'Pittsburgh Steelers': 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
    'Tampa Bay Buccaneers': 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
    'Indianapolis Colts': 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
    'New Orleans Saints': 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
    'Carolina Panthers': 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
    'Jacksonville Jaguars': 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
    'Denver Broncos': 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
    'Chicago Bears': 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
    'New England Patriots': 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png'
};

// Global variables
let currentFilter = 'all';
let playerData = sampleData; // Will be replaced with Google Sheets data

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Animate hero stats
        animateHeroStats();
        
        // Set up navigation
        setupNavigation();
        
        // Load and display data
        console.log('Loading player data...');
        await loadPlayerData();
        console.log('Data loaded, rendering positions...');
        renderAllPositions();
        
        // Set up scroll animations
        setupScrollAnimations();
        
        // Set up modal
        setupModal();
        
        // Set up mobile optimization
        setupMobileOptimization();
        
        // Hide loading state
        hideLoading();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback to sample data
        playerData = sampleData;
        renderAllPositions();
        hideLoading();
    }
}

function hideLoading() {
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    }
}

function setupMobileOptimization() {
    // Handle orientation changes and resize events
    window.addEventListener('resize', debounce(() => {
        const isMobile = window.innerWidth <= 768;
        const cards = document.querySelectorAll('.player-card');
        
        cards.forEach(card => {
            if (isMobile) {
                // Ensure mobile cards are visible
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }
        });
    }, 250));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function animateHeroStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        
        if (target === 2500) {
            // Special handling for players count
            animateNumberWithPlus(stat, 0, target, 2000);
        } else {
            animateNumber(stat, 0, target, 2000);
        }
    });
}

function animateNumberWithPlus(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current.toString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            // Add the "+" when animation completes
            element.textContent = current.toString() + '+';
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current.toString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Update filter
            currentFilter = this.getAttribute('data-position');
            
            // Re-render content
            renderAllPositions();
        });
    });
}

async function loadPlayerData() {
    try {
        console.log('Attempting to load data from Google Sheets...');
        console.log('Sheets ID:', GOOGLE_SHEETS_ID);
        console.log('API Key:', API_KEY ? 'Present' : 'Missing');
        
        // Fetch from Google Sheets
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/Sheet1?key=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw Google Sheets response:', data);
        
        if (data.values && data.values.length > 0) {
            playerData = processGoogleSheetsData(data);
            console.log('Successfully loaded player data from Google Sheets:', playerData);
        } else {
            console.log('No data found in Google Sheets, using sample data');
            playerData = sampleData;
        }
    } catch (error) {
        console.error('Error loading player data from Google Sheets:', error);
        console.log('Falling back to sample data');
        playerData = sampleData;
    }
}

function processGoogleSheetsData(data) {
    // Process Google Sheets data into the expected format
    const processedData = {};
    
    // Expected column order: position, name, team, snaps, PFF_WAR, pffGrade, pffGradeRank, facetGrade1, facetGrade2, image, analysis
    data.values.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        
        // Skip empty rows
        if (!row[0] || row[0].trim() === '') return;
        
        const [position, name, team, snaps, PFF_WAR, pffGrade, pffGradeRank, facetGrade1, facetGrade2, image, analysis, profile] = row;
        
        if (!processedData[position]) {
            processedData[position] = [];
        }
        
        processedData[position].push({
            name: name || 'Unknown Player',
            team: team || 'Unknown Team',
            snaps: parseInt(snaps) || 0,
            PFF_WAR: parseFloat(PFF_WAR) || 0,
            pffGrade: parseFloat(pffGrade) || 0,
            pffGradeRank: parseInt(pffGradeRank) || 0,
            facetGrade1: parseFloat(facetGrade1) || 0,
            facetGrade2: parseFloat(facetGrade2) || 0,
            image: image || 'https://a.espncdn.com/i/headshots/nfl/players/full/3918297.png',
            analysis: analysis || 'No analysis available.',
            profile: profile || '#'
        });
    });
    
    // Sort each position by PFF_WAR (descending) and take top 5
    Object.keys(processedData).forEach(position => {
        processedData[position] = processedData[position]
            .sort((a, b) => b.PFF_WAR - a.PFF_WAR)
            .slice(0, 5);
    });
    
    return processedData;
}

function renderAllPositions() {
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = '';
    
    // Ensure we have data
    if (!playerData || Object.keys(playerData).length === 0) {
        console.log('No player data available, using sample data');
        playerData = sampleData;
    }
    
    const positions = Object.keys(playerData);
    
    if (positions.length === 0) {
        mainContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6c757d;">No data available</div>';
        return;
    }
    
    positions.forEach(position => {
        if (currentFilter === 'all' || currentFilter === position) {
            const section = createPositionSection(position, playerData[position]);
            mainContent.appendChild(section);
            // Make section visible immediately
            section.classList.add('visible');
            // Trigger staggered card animations
            animateCardsInSection(section);
        }
    });
    
    // Trigger scroll animations for visible sections
    setTimeout(() => {
        const sections = document.querySelectorAll('.position-section');
        sections.forEach(section => {
            if (isElementInViewport(section)) {
                section.classList.add('visible');
            }
        });
    }, 100);
}

const positionNames = {
    QB: 'Quarterback',
    HB: 'Running Back',
    WR: 'Wide Receiver',
    TE: 'Tight End',
    T: 'Tackle',
    G: 'Guard',
    C: 'Center',
    DI: 'Defensive Interior',
    ED: 'Edge Defender',
    LB: 'Linebacker',
    CB: 'Cornerback',
    S: 'Safety'
};

function createPositionSection(position, players) {
    const section = document.createElement('div');
    section.className = 'position-section';
    section.setAttribute('data-position', position);

    const facetGradeLabels = {
        QB: ['Passing Grade', 'Rushing Grade'],
        HB: ['Rushing Grade', 'Receiving Grade'],
        WR: ['Receiving Grade', 'Run-blocking Grade'],
        TE: ['Receiving Grade', 'Run-blocking Grade'],
        T: ['Pass-blocking Grade', 'Run-blocking Grade'],
        G: ['Pass-blocking Grade', 'Run-blocking Grade'],
        C: ['Pass-blocking Grade', 'Run-blocking Grade'],
        DI: ['Pass-rush Grade', 'Run-defense Grade'],
        ED: ['Pass-rush Grade', 'Run-defense Grade'],
        LB: ['Coverage Grade', 'Run-defense Grade'],
        CB: ['Coverage Grade', 'Run-defense Grade'],
        S: ['Coverage Grade', 'Run-defense Grade'],
    };
    
    section.innerHTML = `
        <div class="position-header">
            <h2 class="position-title">${positionNames[position] || position}</h2>
            <p class="position-subtitle">Top five players</p>
        </div>
        <div class="players-grid">
            ${players.map(player => createPlayerCard(player, position, players)).join('')}
        </div>
    `;
    
    return section;
}

function createPlayerCard(player, position, allPlayers) {
    const facetGradeLabels = {
        QB: ['Passing Grade', 'Rushing Grade'],
        HB: ['Rushing Grade', 'Receiving Grade'],
        WR: ['Receiving Grade', 'Run-blocking Grade'],
        TE: ['Receiving Grade', 'Run-blocking Grade'],
        T: ['Pass-blocking Grade', 'Run-blocking Grade'],
        G: ['Pass-blocking Grade', 'Run-blocking Grade'],
        C: ['Pass-blocking Grade', 'Run-blocking Grade'],
        DI: ['Pass-rush Grade', 'Run-defense Grade'],
        ED: ['Pass-rush Grade', 'Run-defense Grade'],
        LB: ['Coverage Grade', 'Run-defense Grade'],
        CB: ['Coverage Grade', 'Run-defense Grade'],
        S: ['Coverage Grade', 'Run-defense Grade'],
    };

    const labels = facetGradeLabels[position] || ['Facet Grade 1', 'Facet Grade 2'];
    const teamColor = teamColors[player.team] || '#0B1533';
    const teamLogo = teamLogos[player.team] || '';

    const isTopPlayer = allPlayers && player.PFF_WAR === Math.max(...allPlayers.map(p => p.PFF_WAR));
    
    return `
        <div class="player-card ${isTopPlayer ? 'top-player' : ''}" data-player='${JSON.stringify(player)}' style="border-left: 4px solid ${teamColor}; position: relative;">
            <div class="player-rank" style="position: absolute; top: 1rem; right: 1rem; z-index: 2;">${parseFloat(player.PFF_WAR).toFixed(3)}</div>
            ${teamLogo ? `<div class="team-logo-watermark" style="position: absolute; top: 2rem; left: 50%; transform: translateX(-50%); width: 240px; height: 240px; opacity: 0.05; z-index: 0;">
                <img src="${teamLogo}" alt="${player.team}" style="width: 100%; height: 100%; object-fit: contain; filter: grayscale(20%) brightness(1.1);">
            </div>` : ''}
            <div class="player-image" style="position: relative; z-index: 2;">
                <img src="${player.image}" alt="${player.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                <div class="player-image-fallback" style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: #f8f9fa; color: #6c757d; font-weight: 600; font-size: 14px;">
                    ${player.name.split(' ')[0]}
                </div>
            </div>
            <h3 class="player-name" style="position: relative; z-index: 2;">${player.name}</h3>
            <p class="player-team" style="position: relative; z-index: 2;">${player.team}</p>
            
            <div class="progress-container">
                <div class="progress-label">
                    <span>2025 PFF Grade</span>
                    <span>${parseFloat(player.pffGrade).toFixed(1)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${player.pffGrade}%; background: linear-gradient(90deg, ${teamColor}, ${teamColor}dd);"></div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value">${player.snaps.toLocaleString()}</div>
                    <div class="stat-label">2025 Snaps</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">#${player.pffGradeRank}</div>
                    <div class="stat-label">PFF Grade Rank</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${player.facetGrade1}</div>
                    <div class="stat-label">${labels[0]}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${player.facetGrade2}</div>
                    <div class="stat-label">${labels[1]}</div>
                </div>
            </div>
            
            <a href="${player.profile || '#'}" target="_blank" class="profile-button" style="background: linear-gradient(45deg, ${teamColor}, ${teamColor}dd); text-decoration: none; display: block; text-align: center;">
                View Profile
            </a>
            
            <div class="analysis-blurb">
                ${player.analysis}
            </div>
        </div>
    `;
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Animate counters when section becomes visible
                animateCountersInSection(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe all position sections
    const sections = document.querySelectorAll('.position-section');
    sections.forEach(section => {
        observer.observe(section);
    });
}

function animateCountersInSection(section) {
    const counters = section.querySelectorAll('.animated-counter');
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const isDecimal = counter.hasAttribute('data-decimal');
        animateCounter(counter, 0, target, 1500, isDecimal);
    });
}

function animateCardsInSection(section) {
    const cards = section.querySelectorAll('.player-card');
    
    // Check if device is mobile
    const isMobile = window.innerWidth <= 768;
    
    cards.forEach((card, index) => {
        if (isMobile) {
            // On mobile, show immediately without animation
            card.classList.add('animate-in');
        } else {
            // On desktop, use staggered animation
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 150); // 150ms delay between each card
        }
    });
}

function animateCounter(element, start, end, duration, isDecimal = false) {
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (end - start) * easeOutQuart;
        
        if (isDecimal) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function setupModal() {
    const modal = document.getElementById('playerModal');
    const closeBtn = document.querySelector('.modal-close');
    
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function openPlayerProfile(playerName) {
    // Find player data and position
    let player = null;
    let playerPosition = null;
    
    Object.entries(playerData).forEach(([position, positionPlayers]) => {
        const found = positionPlayers.find(p => p.name === playerName);
        if (found) {
            player = found;
            playerPosition = position;
        }
    });
    
    if (!player) return;
    
    const facetGradeLabels = {
        QB: ['Passing Grade', 'Rushing Grade'],
        HB: ['Rushing Grade', 'Receiving Grade'],
        WR: ['Receiving Grade', 'Run-blocking Grade'],
        TE: ['Receiving Grade', 'Run-blocking Grade'],
        T: ['Pass-blocking Grade', 'Run-blocking Grade'],
        G: ['Pass-blocking Grade', 'Run-blocking Grade'],
        C: ['Pass-blocking Grade', 'Run-blocking Grade'],
        DI: ['Pass-rush Grade', 'Run-defense Grade'],
        ED: ['Pass-rush Grade', 'Run-defense Grade'],
        LB: ['Coverage Grade', 'Run-defense Grade'],
        CB: ['Coverage Grade', 'Run-defense Grade'],
        S: ['Coverage Grade', 'Run-defense Grade'],
    };

    const labels = facetGradeLabels[playerPosition] || ['Facet Grade 1', 'Facet Grade 2'];
    
    const modal = document.getElementById('playerModal');
    const modalBody = document.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="position: relative; display: inline-block; margin-bottom: 1rem;">
                <img src="${player.image}" alt="${player.name}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; object-position: center;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                <div style="display: none; width: 150px; height: 150px; border-radius: 50%; background: #f8f9fa; color: #6c757d; font-weight: 600; font-size: 18px; align-items: center; justify-content: center;">
                    ${player.name.split(' ')[0]}
                </div>
            </div>
            <h2 style="color: #0B1533; margin-bottom: 0.5rem;">${player.name}</h2>
            <p style="color: #6c757d; font-size: 1.1rem;">${player.team}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: rgba(11, 21, 51, 0.1); border: 1px solid rgba(11, 21, 51, 0.3); border-radius: 10px; padding: 1rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: 600; color: #0B1533; margin-bottom: 0.5rem;">${parseFloat(player.pffGrade).toFixed(1)}</div>
                <div style="color: #6c757d; font-size: 0.9rem;">PFF Grade</div>
            </div>
            <div style="background: rgba(11, 21, 51, 0.1); border: 1px solid rgba(11, 21, 51, 0.3); border-radius: 10px; padding: 1rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: 600; color: #0B1533; margin-bottom: 0.5rem;">#${player.pffGradeRank}</div>
                <div style="color: #6c757d; font-size: 0.9rem;">Grade Rank</div>
            </div>
            <div style="background: rgba(11, 21, 51, 0.1); border: 1px solid rgba(11, 21, 51, 0.3); border-radius: 10px; padding: 1rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: 600; color: #0B1533; margin-bottom: 0.5rem;">${player.snaps.toLocaleString()}</div>
                <div style="color: #6c757d; font-size: 0.9rem;">Total Snaps</div>
            </div>
        </div>
        
        <div style="background: rgba(11, 21, 51, 0.05); border-left: 3px solid #0B1533; padding: 1.5rem; border-radius: 0 10px 10px 0; margin-bottom: 2rem;">
            <h3 style="color: #0B1533; margin-bottom: 1rem;">Analysis</h3>
            <p style="line-height: 1.6; color: #6c757d;">${player.analysis}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="background: rgba(11, 21, 51, 0.1); border: 1px solid rgba(11, 21, 51, 0.3); border-radius: 10px; padding: 1rem; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 600; color: #0B1533; margin-bottom: 0.5rem;">${player.facetGrade1}</div>
                <div style="color: #6c757d; font-size: 0.9rem;">${labels[0]}</div>
            </div>
            <div style="background: rgba(11, 21, 51, 0.1); border: 1px solid rgba(11, 21, 51, 0.3); border-radius: 10px; padding: 1rem; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 600; color: #0B1533; margin-bottom: 0.5rem;">${player.facetGrade2}</div>
                <div style="color: #6c757d; font-size: 0.9rem;">${labels[1]}</div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('playerModal');
    modal.classList.remove('active');
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Utility function to refresh data from Google Sheets
async function refreshData() {
    showLoading();
    await loadPlayerData();
    renderAllPositions();
    hideLoading();
}

function showLoading() {
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
}


// Export functions for potential external use
window.openPlayerProfile = openPlayerProfile;
window.refreshData = refreshData;

