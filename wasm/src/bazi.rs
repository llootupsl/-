//! 八字命理计算模块
//!
//! 实现中国传统的八字排盘和命理分析

use wasm_bindgen::prelude::*;

/// 天干
#[derive(Clone, Copy, Debug)]
enum HeavenlyStem {
    Jia,    // 甲
    Yi,     // 乙
    Bing,   // 丙
    Ding,   // 丁
    Wu,     // 戊
    Ji,     // 己
    Geng,   // 庚
    Xin,    // 辛
    Ren,    // 壬
    Gui,    // 癸
}

/// 地支
#[derive(Clone, Copy, Debug)]
enum EarthlyBranch {
    Zi,     // 子
    Chou,   // 丑
    Yin,    // 寅
    Mao,    // 卯
    Chen,   // 辰
    Si,     // 巳
    Wu,     // 午
    Wei,    // 未
    Shen,   // 申
    You,    // 酉
    Xu,     // 戌
    Hai,    // 亥
}

/// 五行
#[derive(Clone, Copy, Debug, PartialEq)]
enum FiveElements {
    Wood,   // 木
    Fire,   // 火
    Earth,  // 土
    Metal,  // 金
    Water,  // 水
}

impl FiveElements {
    /// 天干对应的五行
    fn from_stem(stem: &HeavenlyStem) -> Self {
        match stem {
            HeavenlyStem::Jia | HeavenlyStem::Yi => FiveElements::Wood,
            HeavenlyStem::Bing | HeavenlyStem::Ding => FiveElements::Fire,
            HeavenlyStem::Wu | HeavenlyStem::Ji => FiveElements::Earth,
            HeavenlyStem::Geng | HeavenlyStem::Xin => FiveElements::Metal,
            HeavenlyStem::Ren | HeavenlyStem::Gui => FiveElements::Water,
        }
    }

    /// 地支对应的五行
    fn from_branch(branch: &EarthlyBranch) -> Self {
        match branch {
            EarthlyBranch::Yin | EarthlyBranch::Mao => FiveElements::Wood,
            EarthlyBranch::Si | EarthlyBranch::Wu => FiveElements::Fire,
            EarthlyBranch::Chen | EarthlyBranch::Xu | EarthlyBranch::Chou | EarthlyBranch::Wei => FiveElements::Earth,
            EarthlyBranch::Shen | EarthlyBranch::You => FiveElements::Metal,
            EarthlyBranch::Hai | EarthlyBranch::Zi => FiveElements::Water,
        }
    }
}

/// 十神
#[derive(Clone, Debug)]
enum TenGods {
    Bianchi,    // 比肩
    Jiecai,     // 劫财
    Shangguan,   // 食神
    ShangGuan,  // 伤官
    Zhengyin,    // 正印
    Pianyin,     // 偏印
    Zhengcai,    // 正财
    Piancai,     // 偏财
    Qisha,       // 七杀
    Zhengguan,   // 正官
}

/// 八字
#[wasm_bindgen]
pub struct BaziEngine {
    year_stem: HeavenlyStem,
    year_branch: EarthlyBranch,
    month_stem: HeavenlyStem,
    month_branch: EarthlyBranch,
    day_stem: HeavenlyStem,
    day_branch: EarthlyBranch,
    hour_stem: HeavenlyStem,
    hour_branch: EarthlyBranch,
}

#[wasm_bindgen]
impl BaziEngine {
    /// 创建八字排盘
    #[wasm_bindgen(constructor)]
    pub fn new(
        year: u16,
        month: u8,
        day: u8,
        hour: u8,
    ) -> Self {
        let year_stem = Self::get_year_stem(year);
        let year_branch = Self::get_year_branch(year);
        let month_stem = Self::get_month_stem(year, month);
        let month_branch = Self::get_month_branch(month);
        let day_stem = Self::get_day_stem(year, month, day);
        let day_branch = Self::get_day_branch(year, month, day);
        let hour_stem = Self::get_hour_stem(day_stem, hour);
        let hour_branch = Self::get_hour_branch(hour);

        BaziEngine {
            year_stem,
            year_branch,
            month_stem,
            month_branch,
            day_stem,
            day_branch,
            hour_stem,
            hour_branch,
        }
    }

    /// 获取年干
    fn get_year_stem(year: u16) -> HeavenlyStem {
        let stems = [
            HeavenlyStem::Jia, HeavenlyStem::Yi, HeavenlyStem::Bing,
            HeavenlyStem::Ding, HeavenlyStem::Wu, HeavenlyStem::Ji,
            HeavenlyStem::Geng, HeavenlyStem::Xin, HeavenlyStem::Ren,
            HeavenlyStem::Gui,
        ];
        stems[((year - 4) % 10) as usize]
    }

    /// 获取年支
    fn get_year_branch(year: u16) -> EarthlyBranch {
        let branches = [
            EarthlyBranch::Zi, EarthlyBranch::Chou, EarthlyBranch::Yin,
            EarthlyBranch::Mao, EarthlyBranch::Chen, EarthlyBranch::Si,
            EarthlyBranch::Wu, EarthlyBranch::Wei, EarthlyBranch::Shen,
            EarthlyBranch::You, EarthlyBranch::Xu, EarthlyBranch::Hai,
        ];
        branches[((year - 4) % 12) as usize]
    }

    /// 获取月干
    fn get_month_stem(year: u16, month: u8) -> HeavenlyStem {
        // 月干 = (年干 * 2 + 月份) mod 10
        let year_stem_idx = ((year - 4) % 10) as i32;
        let month_stem_idx = ((year_stem_idx * 2 + month as i32) % 10) as usize;

        let stems = [
            HeavenlyStem::Jia, HeavenlyStem::Yi, HeavenlyStem::Bing,
            HeavenlyStem::Ding, HeavenlyStem::Wu, HeavenlyStem::Ji,
            HeavenlyStem::Geng, HeavenlyStem::Xin, HeavenlyStem::Ren,
            HeavenlyStem::Gui,
        ];
        stems[month_stem_idx]
    }

    /// 获取月支
    fn get_month_branch(month: u8) -> EarthlyBranch {
        let branches = [
            EarthlyBranch::Yin,  // 正月
            EarthlyBranch::Mao, // 二月
            EarthlyBranch::Chen, // 三月
            EarthlyBranch::Si,  // 四月
            EarthlyBranch::Wu,  // 五月
            EarthlyBranch::Wei, // 六月
            EarthlyBranch::Shen, // 七月
            EarthlyBranch::You, // 八月
            EarthlyBranch::Xu,  // 九月
            EarthlyBranch::Hai, // 十月
            EarthlyBranch::Zi,  // 十一月
            EarthlyBranch::Chou, // 十二月
        ];

        if month >= 1 && month <= 12 {
            branches[(month - 1) as usize]
        } else {
            branches[0]
        }
    }

    /// 获取日干
    fn get_day_stem(year: u16, month: u8, day: u8) -> HeavenlyStem {
        // 使用简化的儒略日计算
        let y = year as i32;
        let m = month as i32;
        let d = day as i32;

        let jd = Self::to_julian_day(y, m, d);
        let day_stem_idx = ((jd + 5) % 10) as usize;

        let stems = [
            HeavenlyStem::Jia, HeavenlyStem::Yi, HeavenlyStem::Bing,
            HeavenlyStem::Ding, HeavenlyStem::Wu, HeavenlyStem::Ji,
            HeavenlyStem::Geng, HeavenlyStem::Xin, HeavenlyStem::Ren,
            HeavenlyStem::Gui,
        ];
        stems[day_stem_idx]
    }

    /// 获取日支
    fn get_day_branch(year: u16, month: u8, day: u8) -> EarthlyBranch {
        let y = year as i32;
        let m = month as i32;
        let d = day as i32;

        let jd = Self::to_julian_day(y, m, d);
        let day_branch_idx = ((jd + 7) % 12) as usize;

        let branches = [
            EarthlyBranch::Zi, EarthlyBranch::Chou, EarthlyBranch::Yin,
            EarthlyBranch::Mao, EarthlyBranch::Chen, EarthlyBranch::Si,
            EarthlyBranch::Wu, EarthlyBranch::Wei, EarthlyBranch::Shen,
            EarthlyBranch::You, EarthlyBranch::Xu, EarthlyBranch::Hai,
        ];
        branches[day_branch_idx]
    }

    /// 获取时支
    fn get_hour_stem(day_stem: HeavenlyStem, hour: u8) -> HeavenlyStem {
        // 时干 = (日干 * 2 + 时辰数) mod 10
        let day_stem_idx = match day_stem {
            HeavenlyStem::Jia => 0,
            HeavenlyStem::Yi => 1,
            HeavenlyStem::Bing => 2,
            HeavenlyStem::Ding => 3,
            HeavenlyStem::Wu => 4,
            HeavenlyStem::Ji => 5,
            HeavenlyStem::Geng => 6,
            HeavenlyStem::Xin => 7,
            HeavenlyStem::Ren => 8,
            HeavenlyStem::Gui => 9,
        };

        // 时辰数：子时=0, 丑时=1, ...
        let hour_index = if hour >= 23 || hour < 1 {
            0  // 子时
        } else if hour < 3 {
            1  // 丑时
        } else if hour < 5 {
            2  // 寅时
        } else if hour < 7 {
            3  // 卯时
        } else if hour < 9 {
            4  // 辰时
        } else if hour < 11 {
            5  // 巳时
        } else if hour < 13 {
            6  // 午时
        } else if hour < 15 {
            7  // 未时
        } else if hour < 17 {
            8  // 申时
        } else if hour < 19 {
            9  // 酉时
        } else if hour < 21 {
            10 // 戌时
        } else {
            11 // 亥时
        };

        let hour_stem_idx = ((day_stem_idx * 2 + hour_index) % 10) as usize;

        let stems = [
            HeavenlyStem::Jia, HeavenlyStem::Yi, HeavenlyStem::Bing,
            HeavenlyStem::Ding, HeavenlyStem::Wu, HeavenlyStem::Ji,
            HeavenlyStem::Geng, HeavenlyStem::Xin, HeavenlyStem::Ren,
            HeavenlyStem::Gui,
        ];
        stems[hour_stem_idx]
    }

    /// 获取时支
    fn get_hour_branch(hour: u8) -> EarthlyBranch {
        if hour >= 23 || hour < 1 {
            EarthlyBranch::Zi
        } else if hour < 3 {
            EarthlyBranch::Chou
        } else if hour < 5 {
            EarthlyBranch::Yin
        } else if hour < 7 {
            EarthlyBranch::Mao
        } else if hour < 9 {
            EarthlyBranch::Chen
        } else if hour < 11 {
            EarthlyBranch::Si
        } else if hour < 13 {
            EarthlyBranch::Wu
        } else if hour < 15 {
            EarthlyBranch::Wei
        } else if hour < 17 {
            EarthlyBranch::Shen
        } else if hour < 19 {
            EarthlyBranch::You
        } else if hour < 21 {
            EarthlyBranch::Xu
        } else {
            EarthlyBranch::Hai
        }
    }

    /// 转换为儒略日
    fn to_julian_day(year: i32, month: i32, day: i32) -> i32 {
        let a = (14 - month) / 12;
        let y = year + 4800 - a;
        let m = month + 12 * a - 3;

        let jd = day + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045;
        jd
    }

    /// 获取八字字符串
    pub fn to_string(&self) -> String {
        format!(
            "{}{}年 {}{}月 {}{}日 {}{}时",
            Self::stem_name(self.year_stem),
            Self::branch_name(self.year_branch),
            Self::stem_name(self.month_stem),
            Self::branch_name(self.month_branch),
            Self::stem_name(self.day_stem),
            Self::branch_name(self.day_branch),
            Self::stem_name(self.hour_stem),
            Self::branch_name(self.hour_branch),
        )
    }

    fn stem_name(stem: HeavenlyStem) -> &'static str {
        match stem {
            HeavenlyStem::Jia => "甲",
            HeavenlyStem::Yi => "乙",
            HeavenlyStem::Bing => "丙",
            HeavenlyStem::Ding => "丁",
            HeavenlyStem::Wu => "戊",
            HeavenlyStem::Ji => "己",
            HeavenlyStem::Geng => "庚",
            HeavenlyStem::Xin => "辛",
            HeavenlyStem::Ren => "壬",
            HeavenlyStem::Gui => "癸",
        }
    }

    fn branch_name(branch: EarthlyBranch) -> &'static str {
        match branch {
            EarthlyBranch::Zi => "子",
            EarthlyBranch::Chou => "丑",
            EarthlyBranch::Yin => "寅",
            EarthlyBranch::Mao => "卯",
            EarthlyBranch::Chen => "辰",
            EarthlyBranch::Si => "巳",
            EarthlyBranch::Wu => "午",
            EarthlyBranch::Wei => "未",
            EarthlyBranch::Shen => "申",
            EarthlyBranch::You => "酉",
            EarthlyBranch::Xu => "戌",
            EarthlyBranch::Hai => "亥",
        }
    }

    /// 获取八字JSON表示
    pub fn to_json(&self) -> String {
        serde_json::json!({
            "year": {
                "stem": Self::stem_name(self.year_stem),
                "branch": Self::branch_name(self.year_branch),
                "element": Self::element_name(FiveElements::from_stem(&self.year_stem)),
            },
            "month": {
                "stem": Self::stem_name(self.month_stem),
                "branch": Self::branch_name(self.month_branch),
                "element": Self::element_name(FiveElements::from_stem(&self.month_stem)),
            },
            "day": {
                "stem": Self::stem_name(self.day_stem),
                "branch": Self::branch_name(self.day_branch),
                "element": Self::element_name(FiveElements::from_stem(&self.day_stem)),
            },
            "hour": {
                "stem": Self::stem_name(self.hour_stem),
                "branch": Self::branch_name(self.hour_branch),
                "element": Self::element_name(FiveElements::from_stem(&self.hour_stem)),
            },
        }).to_string()
    }

    fn element_name(element: FiveElements) -> &'static str {
        match element {
            FiveElements::Wood => "木",
            FiveElements::Fire => "火",
            FiveElements::Earth => "土",
            FiveElements::Metal => "金",
            FiveElements::Water => "水",
        }
    }

    /// 计算五行强弱
    pub fn element_strength(&self) -> String {
        let mut counts: [i32; 5] = [0; 5]; // 木火土金水

        let elements = [
            FiveElements::from_stem(&self.year_stem),
            FiveElements::from_stem(&self.month_stem),
            FiveElements::from_stem(&self.day_stem),
            FiveElements::from_stem(&self.hour_stem),
            FiveElements::from_branch(&self.year_branch),
            FiveElements::from_branch(&self.month_branch),
            FiveElements::from_branch(&self.day_branch),
            FiveElements::from_branch(&self.hour_branch),
        ];

        for elem in &elements {
            let idx = match elem {
                FiveElements::Wood => 0,
                FiveElements::Fire => 1,
                FiveElements::Earth => 2,
                FiveElements::Metal => 3,
                FiveElements::Water => 4,
            };
            counts[idx] += 1;
        }

        let total: i32 = counts.iter().sum();
        let strengths: Vec<(i32, &'static str)> = vec![
            (counts[0], "木"),
            (counts[1], "火"),
            (counts[2], "土"),
            (counts[3], "金"),
            (counts[4], "水"),
        ];

        let strongest = strengths.iter().max_by_key(|(c, _)| c).unwrap();

        format!(
            "木:{:.0}% 火:{:.0}% 土:{:.0}% 金:{:.0}% 水:{:.0}% - 最强:{}",
            counts[0] as f32 / total as f32 * 100.0,
            counts[1] as f32 / total as f32 * 100.0,
            counts[2] as f32 / total as f32 * 100.0,
            counts[3] as f32 / total as f32 * 100.0,
            counts[4] as f32 / total as f32 * 100.0,
            strongest.1
        )
    }

    /// 获取日主强弱
    pub fn day_master_strength(&self) -> String {
        // 日主就是日干
        let day_element = FiveElements::from_stem(&self.day_stem);

        // 简单判断：查看其他三柱的五行对日主的生克
        let mut score = 0;

        // 月支对日主的影响最大
        let month_element = FiveElements::from_branch(&self.month_branch);

        // 计算相生相克
        if Self::is_生(day_element, month_element) {
            score += 2;
        } else if Self::is_克(day_element, month_element) {
            score -= 2;
        }

        match score {
            s if s > 0 => format!("日主{}旺", Self::element_name(day_element)),
            s if s < 0 => format!("日主{}弱", Self::element_name(day_element)),
            _ => format!("日主{}中和", Self::element_name(day_element)),
        }
    }

    fn is_生(element: FiveElements, by: FiveElements) -> bool {
        // element 被 by 生
        (element == FiveElements::Fire && by == FiveElements::Wood) ||
        (element == FiveElements::Earth && by == FiveElements::Fire) ||
        (element == FiveElements::Metal && by == FiveElements::Earth) ||
        (element == FiveElements::Water && by == FiveElements::Metal) ||
        (element == FiveElements::Wood && by == FiveElements::Water)
    }

    fn is_克(element: FiveElements, by: FiveElements) -> bool {
        // element 被 by 克
        (element == FiveElements::Fire && by == FiveElements::Water) ||
        (element == FiveElements::Earth && by == FiveElements::Wood) ||
        (element == FiveElements::Metal && by == FiveElements::Fire) ||
        (element == FiveElements::Water && by == FiveElements::Earth) ||
        (element == FiveElements::Wood && by == FiveElements::Metal)
    }
}
