const DATA_PATH = "data/data_processed/";
const CHART_WIDTH = 620;

const mapProjection = {
  "type": "mercator",
  "center": [134, -27],
  "scale": 620
};

const australiaBase = {
  "data": {
    "url": "https://vega.github.io/vega-datasets/data/world-110m.json",
    "format": { "type": "topojson", "feature": "countries" }
  },
  "transform": [{ "filter": "datum.id == 36" }],
  "mark": {
    "type": "geoshape",
    "fill": "#eef1ec",
    "stroke": "#8fa196",
    "strokeWidth": 1.2
  }
};

const baseConfig = {
  "background": "#ffffff",
  "view": { "stroke": null },
  "axis": {
    "labelFontSize": 12,
    "titleFontSize": 13,
    "gridColor": "#e6e3dc",
    "domain": false,
    "tickColor": "#b8b0a4"
  },
  "legend": {
    "labelFontSize": 11,
    "titleFontSize": 12
  }
};

const typePalette = {
  "domain": [
    "Indigenous protected area",
    "National park",
    "Nature reserve",
    "Conservation park/reserve",
    "Private or covenant",
    "Regional reserve",
    "Marine protected area",
    "Other"
  ],
  "range": [
    "#0b6e4f",
    "#2d9cdb",
    "#f2c94c",
    "#9b51e0",
    "#eb5757",
    "#f2994a",
    "#56ccf2",
    "#828282"
  ]
};

function chartTitle(text, subtitle) {
  return undefined;
}

function embed(id, spec) {
  const target = document.querySelector(id);
  if (target) {
    vegaEmbed(target, spec, { actions: false });
  }
}

/* 1. Proportional Symbol Map */
const mainMapTypePalette = {
  "domain": [
    "Indigenous protected area",
    "National park",
    "Nature reserve",
    "Conservation park/reserve",
    "Marine protected area"
  ],
  "range": [
    "#0b6e4f",
    "#2d9cdb",
    "#f2c94c",
    "#9b51e0",
    "#56ccf2"
  ]
};

const mapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 760,
  "height": 450,
  "title": chartTitle(
    "Major Protected Areas Across Australia",
    "Filtered to areas of 50,000 hectares or larger and five main protected-area types."
  ),
  "projection": {
    "type": "mercator",
    "center": [134, -27],
    "scale": 620,
    "translate": [380, 230]
  },
  "layer": [
    australiaBase,
    {
      "data": { "url": DATA_PATH + "protected_areas_points.csv" },
      "transform": [
        { "filter": "datum.area_ha >= 50000" },
        {
          "filter": "indexof(['Indigenous protected area', 'National park', 'Nature reserve', 'Conservation park/reserve', 'Marine protected area'], datum.type_group) >= 0"
        }
      ],
      "mark": {
        "type": "circle",
        "opacity": 0.66,
        "stroke": "#ffffff",
        "strokeWidth": 0.4
      },
      "encoding": {
        "longitude": { "field": "longitude", "type": "quantitative" },
        "latitude": { "field": "latitude", "type": "quantitative" },
        "size": {
          "field": "area_ha",
          "type": "quantitative",
          "scale": { "type": "sqrt", "range": [18, 720] },
          "legend": { "title": "Area (ha)", "format": ",.0f", "orient": "bottom" }
        },
        "color": {
          "field": "type_group",
          "type": "nominal",
          "title": "Protected area type",
          "scale": mainMapTypePalette,
          "legend": { "orient": "bottom", "columns": 2 }
        },
        "tooltip": [
          { "field": "name", "type": "nominal", "title": "Protected area" },
          { "field": "state", "type": "nominal", "title": "State" },
          { "field": "type_group", "type": "nominal", "title": "Type" },
          { "field": "iucn_category", "type": "nominal", "title": "IUCN category" },
          { "field": "area_ha", "type": "quantitative", "title": "Area (ha)", "format": ",.0f" }
        ]
      }
    }
  ],
  "config": baseConfig
};
embed("#map", mapSpec);

/* 2. Horizontal Bar Chart */
const stateBarSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 620,
  "height": 320,
  "title": chartTitle(
    "Total Protected Area by State and Territory",
    "Western Australia, the Northern Territory and South Australia dominate by total protected area."
  ),
  "data": { "url": DATA_PATH + "protected_area_state_summary.csv" },
  "mark": { "type": "bar", "cornerRadiusEnd": 3 },
  "encoding": {
    "y": { "field": "state", "type": "nominal", "sort": "-x", "title": null },
    "x": {
      "field": "total_area_ha",
      "type": "quantitative",
      "title": "Total protected area (hectares)",
      "axis": { "format": "~s" }
    },
    "color": {
      "field": "state",
      "type": "nominal",
      "legend": null,
      "scale": {
        "range": ["#006d77", "#bb6b3d", "#8d8378", "#7d98bd", "#d4ad4d", "#2a9d8f", "#6f6f6f", "#b8b8b8"]
      }
    },
    "tooltip": [
      { "field": "state", "type": "nominal", "title": "State" },
      { "field": "protected_area_count", "type": "quantitative", "title": "Number of protected areas", "format": "," },
      { "field": "total_area_ha", "type": "quantitative", "title": "Total area (ha)", "format": ",.0f" },
      { "field": "share_of_national_protected_area_pct", "type": "quantitative", "title": "Share of national protected area (%)", "format": ".1f" }
    ]
  },
  "config": baseConfig
};
embed("#stateBar", stateBarSpec);

/* 3. Normalised Choropleth Map */
const indigenousMapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 620,
  "height": 500,
  "title": chartTitle(
    "Protected Area Coverage by State",
    "Normalised choropleth: protected-area hectares as a percentage of state land area."
  ),
  "projection": mapProjection,
  "layer": [
    {
      "data": {
        "url": "https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json",
        "format": { "type": "json", "property": "features" }
      },
      "transform": [
        {
          "calculate": "datum.properties.STATE_NAME == 'New South Wales' ? 'NSW' : datum.properties.STATE_NAME == 'Victoria' ? 'VIC' : datum.properties.STATE_NAME == 'Queensland' ? 'QLD' : datum.properties.STATE_NAME == 'South Australia' ? 'SA' : datum.properties.STATE_NAME == 'Western Australia' ? 'WA' : datum.properties.STATE_NAME == 'Tasmania' ? 'TAS' : datum.properties.STATE_NAME == 'Northern Territory' ? 'NT' : datum.properties.STATE_NAME == 'Australian Capital Territory' ? 'ACT' : datum.properties.STATE_NAME",
          "as": "state"
        },
        {
          "lookup": "state",
          "from": {
            "data": { "url": DATA_PATH + "protected_area_state_summary.csv" },
            "key": "state",
            "fields": ["total_area_ha", "protected_area_count"]
          }
        },
        {
          "calculate": "datum.state == 'WA' ? 252987500 : datum.state == 'NT' ? 134912900 : datum.state == 'QLD' ? 172974200 : datum.state == 'SA' ? 98432100 : datum.state == 'NSW' ? 80064200 : datum.state == 'VIC' ? 22741600 : datum.state == 'TAS' ? 6840100 : datum.state == 'ACT' ? 235800 : null",
          "as": "state_area_ha"
        },
        {
          "calculate": "datum.total_area_ha / datum.state_area_ha * 100",
          "as": "coverage_pct"
        }
      ],
      "mark": { "type": "geoshape", "stroke": "#ffffff", "strokeWidth": 1.2 },
      "encoding": {
        "color": {
          "field": "coverage_pct",
          "type": "quantitative",
          "title": "Protected area (% of state land)",
          "scale": { "scheme": "greens", "domain": [0, 35] },
          "legend": { "orient": "bottom", "format": ".0f" }
        },
        "tooltip": [
          { "field": "properties.STATE_NAME", "type": "nominal", "title": "State" },
          { "field": "total_area_ha", "type": "quantitative", "title": "Protected area (ha)", "format": ",.0f" },
          { "field": "coverage_pct", "type": "quantitative", "title": "Protected area coverage (%)", "format": ".1f" },
          { "field": "protected_area_count", "type": "quantitative", "title": "Protected areas", "format": "," }
        ]
      }
    },
    {
      "data": {
        "values": [
          { "state": "WA", "lon": 122, "lat": -26 },
          { "state": "NT", "lon": 133, "lat": -19 },
          { "state": "QLD", "lon": 144, "lat": -22 },
          { "state": "SA", "lon": 135, "lat": -30 },
          { "state": "NSW", "lon": 147, "lat": -32 },
          { "state": "VIC", "lon": 145, "lat": -37 },
          { "state": "TAS", "lon": 147, "lat": -42 },
          { "state": "ACT", "lon": 149, "lat": -35.5 }
        ]
      },
      "transform": [
        {
          "lookup": "state",
          "from": {
            "data": { "url": DATA_PATH + "protected_area_state_summary.csv" },
            "key": "state",
            "fields": ["total_area_ha"]
          }
        },
        {
          "calculate": "datum.state == 'WA' ? 252987500 : datum.state == 'NT' ? 134912900 : datum.state == 'QLD' ? 172974200 : datum.state == 'SA' ? 98432100 : datum.state == 'NSW' ? 80064200 : datum.state == 'VIC' ? 22741600 : datum.state == 'TAS' ? 6840100 : datum.state == 'ACT' ? 235800 : null",
          "as": "state_area_ha"
        },
        {
          "calculate": "format(datum.total_area_ha / datum.state_area_ha * 100, '.0f') + '%'",
          "as": "coverage_label"
        }
      ],
      "mark": {
        "type": "text",
        "fontSize": 12,
        "fontWeight": "bold",
        "color": "#18352a"
      },
      "encoding": {
        "longitude": { "field": "lon", "type": "quantitative" },
        "latitude": { "field": "lat", "type": "quantitative" },
        "text": { "field": "coverage_label", "type": "nominal" }
      }
    }
  ],
  "config": baseConfig
};
embed("#indigenousMap", indigenousMapSpec);

/* 4. Labelled Bar Chart */
const typeBarSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 620,
  "height": 330,
  "title": chartTitle(
    "Protected Area Share by Protected-Area Type",
    "Labelled bar chart: bars show share of national protected-area hectares."
  ),
  "data": { "url": DATA_PATH + "protected_area_type_summary.csv" },
  "transform": [
    { "calculate": "format(datum.share_of_national_protected_area_pct, '.1f') + '%'", "as": "share_label" }
  ],
  "layer": [
    {
      "mark": { "type": "bar", "cornerRadiusEnd": 3 },
      "encoding": {
        "y": { "field": "type_group", "type": "nominal", "sort": "-x", "title": null, "axis": { "labelLimit": 190 } },
        "x": { "field": "share_of_national_protected_area_pct", "type": "quantitative", "title": "Share of national protected area (%)", "scale": { "domain": [0, 56] } },
        "color": { "field": "type_group", "type": "nominal", "legend": null, "scale": typePalette },
        "tooltip": [
          { "field": "type_group", "type": "nominal", "title": "Type" },
          { "field": "total_area_ha", "type": "quantitative", "title": "Total area (ha)", "format": ",.0f" },
          { "field": "share_of_national_protected_area_pct", "type": "quantitative", "title": "Share (%)", "format": ".1f" }
        ]
      }
    },
    {
      "mark": { "type": "text", "align": "left", "baseline": "middle", "dx": 6, "fontWeight": "bold" },
      "encoding": {
        "y": { "field": "type_group", "type": "nominal", "sort": "-x" },
        "x": { "field": "share_of_national_protected_area_pct", "type": "quantitative" },
        "text": { "field": "share_label", "type": "nominal" }
      }
    }
  ],
  "config": baseConfig
};
embed("#typeBar", typeBarSpec);

/* 5. Lollipop Ranking */
const largestRankSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 620,
  "height": 430,
  "title": chartTitle(
    "Top 20 Largest Protected Areas",
    "Lollipop ranking: dot position shows protected-area size; colour shows type."
  ),
  "data": { "url": DATA_PATH + "largest_protected_areas_top100.csv" },
  "transform": [
    {
      "window": [{ "op": "rank", "as": "rank" }],
      "sort": [{ "field": "area_ha", "order": "descending" }]
    },
    { "filter": "datum.rank <= 20" },
    { "calculate": "datum.rank + '. ' + datum.name", "as": "ranked_name" }
  ],
  "layer": [
    {
      "mark": { "type": "bar", "height": 2, "color": "#c5d4cb" },
      "encoding": {
        "y": {
          "field": "ranked_name",
          "type": "nominal",
          "sort": { "field": "rank", "order": "ascending" },
          "title": null,
          "axis": { "labelLimit": 210 }
        },
        "x": {
          "field": "area_ha",
          "type": "quantitative",
          "title": "Area (hectares)",
          "axis": { "format": "~s" }
        }
      }
    },
    {
      "mark": {
        "type": "point",
        "filled": true,
        "size": 120,
        "stroke": "#ffffff",
        "strokeWidth": 1
      },
      "encoding": {
        "y": {
          "field": "ranked_name",
          "type": "nominal",
          "sort": { "field": "rank", "order": "ascending" },
          "title": null
        },
        "x": {
          "field": "area_ha",
          "type": "quantitative",
          "title": "Area (hectares)",
          "axis": { "format": "~s" }
        },
        "color": {
          "field": "type_group",
          "type": "nominal",
          "title": "Type",
          "scale": typePalette,
          "legend": { "orient": "bottom", "columns": 2 }
        },
        "tooltip": [
          { "field": "rank", "type": "quantitative", "title": "Rank" },
          { "field": "name", "type": "nominal", "title": "Protected area" },
          { "field": "state", "type": "nominal", "title": "State" },
          { "field": "type_group", "type": "nominal", "title": "Type" },
          { "field": "area_ha", "type": "quantitative", "title": "Area (ha)", "format": ",.0f" }
        ]
      }
    }
  ],
  "config": baseConfig
};
embed("#largestRankChart", largestRankSpec);

/* 6. Interactive Timeline */
const timelineChartSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": { "url": DATA_PATH + "protected_area_timeline.csv" },
  "vconcat": [
    {
      "width": CHART_WIDTH,
      "height": 300,
      "title": chartTitle(
        "Growth of Australia's Protected Area Network",
        "Drag across the mini chart below to zoom into a selected time period."
      ),
      "layer": [
        {
          "mark": { "type": "area", "opacity": 0.25, "color": "#2a9d8f" },
          "encoding": {
            "x": {
              "field": "gaz_year",
              "type": "quantitative",
              "scale": { "domain": { "param": "brush" } },
              "title": "Gazettal year",
              "axis": { "format": "d" }
            },
            "y": {
              "field": "cumulative_area_ha",
              "type": "quantitative",
              "title": "Cumulative protected area (ha)",
              "axis": { "format": "~s" }
            },
            "tooltip": [
              { "field": "gaz_year", "type": "quantitative", "title": "Year", "format": "d" },
              { "field": "new_area_count", "type": "quantitative", "title": "New protected areas", "format": "," },
              { "field": "new_area_ha", "type": "quantitative", "title": "New area (ha)", "format": ",.0f" },
              { "field": "cumulative_area_ha", "type": "quantitative", "title": "Cumulative area (ha)", "format": ",.0f" }
            ]
          }
        },
        {
          "mark": { "type": "line", "strokeWidth": 3, "color": "#006d77" },
          "encoding": {
            "x": {
              "field": "gaz_year",
              "type": "quantitative",
              "scale": { "domain": { "param": "brush" } }
            },
            "y": { "field": "cumulative_area_ha", "type": "quantitative" }
          }
        }
      ]
    },
    {
  "width": CHART_WIDTH,
  "height": 70,
  "title": {
    "text": "Drag here to select a time period",
    "fontSize": 12,
    "fontWeight": "normal",
    "color": "#506157",
    "anchor": "start",
    "offset": 4
  },
  "params": [
        {
          "name": "brush",
          "select": { "type": "interval", "encodings": ["x"] }
        }
      ],
      "mark": { "type": "area", "color": "#c46f3d", "opacity": 0.75 },
      "encoding": {
        "x": {
          "field": "gaz_year",
          "type": "quantitative",
          "title": null,
          "axis": { "format": "d" }
        },
        "y": {
          "field": "new_area_ha",
          "type": "quantitative",
          "title": null,
          "axis": { "tickCount": 3, "grid": false, "format": "~s" }
        }
      }
    }
  ],
  "config": baseConfig
};
embed("#timelineChart", timelineChartSpec);

/* 7. Quadrant Scatter Plot */
const animalGapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": CHART_WIDTH,
  "height": 360,
  "data": { "url": DATA_PATH + "animal_state_coverage.csv" },
  "title": chartTitle(
    "Animal Need Compared with Protected-Area Coverage",
    "Quadrant scatter plot: each point is one state or territory. Dashed lines show median values."
  ),
  "transform": [
    {
      "calculate": "datum.protected_area_pct_of_state_land < 27.6 && datum.threatened_animal_species > 167 ? 'High animal need / lower land coverage' : datum.protected_area_pct_of_state_land >= 27.6 && datum.threatened_animal_species > 167 ? 'High animal need / higher land coverage' : datum.protected_area_pct_of_state_land < 27.6 && datum.threatened_animal_species <= 167 ? 'Lower animal need / lower land coverage' : 'Lower animal need / higher land coverage'",
      "as": "quadrant"
    }
  ],
  "layer": [
    {
      "data": { "values": [{}] },
      "mark": {
        "type": "rule",
        "stroke": "#9a9488",
        "strokeDash": [6, 5],
        "strokeWidth": 1.2
      },
      "encoding": {
        "x": { "datum": 27.6 }
      }
    },
    {
      "data": { "values": [{}] },
      "mark": {
        "type": "rule",
        "stroke": "#9a9488",
        "strokeDash": [6, 5],
        "strokeWidth": 1.2
      },
      "encoding": {
        "y": { "datum": 167 }
      }
    },
    {
      "mark": {
        "type": "circle",
        "size": 260,
        "opacity": 0.9,
        "stroke": "#ffffff",
        "strokeWidth": 1.5
      },
      "encoding": {
        "x": {
          "field": "protected_area_pct_of_state_land",
          "type": "quantitative",
          "title": "Protected area coverage (% of state land)",
          "scale": { "domain": [0, 60] }
        },
        "y": {
          "field": "threatened_animal_species",
          "type": "quantitative",
          "title": "Threatened animal species",
          "scale": { "domain": [0, 280] }
        },
        "color": {
          "field": "quadrant",
          "type": "nominal",
          "title": "Quadrant",
          "scale": {
            "domain": [
              "High animal need / lower land coverage",
              "High animal need / higher land coverage",
              "Lower animal need / lower land coverage",
              "Lower animal need / higher land coverage"
            ],
            "range": ["#c75d45", "#d6a13f", "#7f9fbd", "#3f8a63"]
          },
          "legend": {
            "orient": "bottom",
            "columns": 2
          }
        },
        "tooltip": [
          { "field": "state", "type": "nominal", "title": "State" },
          { "field": "threatened_animal_species", "type": "quantitative", "title": "Threatened animal species" },
          { "field": "protected_area_pct_of_state_land", "type": "quantitative", "title": "Protected area coverage (%)", "format": ".1f" },
          { "field": "quadrant", "type": "nominal", "title": "Quadrant" }
        ]
      }
    },
    {
      "mark": {
        "type": "text",
        "align": "left",
        "baseline": "middle",
        "dx": 10,
        "fontSize": 12,
        "fontWeight": "bold",
        "fill": "#173326"
      },
      "encoding": {
        "x": {
          "field": "protected_area_pct_of_state_land",
          "type": "quantitative"
        },
        "y": {
          "field": "threatened_animal_species",
          "type": "quantitative"
        },
        "text": {
          "field": "state",
          "type": "nominal"
        }
      }
    }
  ],
  "config": baseConfig
};
embed("#animalGap", animalGapSpec);
/* 8. Animal group bubble chart */
const animalGroupBubbleSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": CHART_WIDTH,
  "height": 380,
  "title": chartTitle(
    "Threat Profile by Animal Group",
    "Bubble chart: x = total listed animals, y = critically endangered + endangered animals."
  ),
  "data": { "url": DATA_PATH + "animal_group_status.csv" },
  "transform": [
    { "calculate": "toNumber(datum.species_count)", "as": "n" },
    {
      "calculate": "datum.status == 'Critically Endangered' || datum.status == 'Endangered' ? datum.n : 0",
      "as": "high_risk_species"
    },
    {
      "calculate": "datum.status == 'Vulnerable' ? datum.n : 0",
      "as": "vulnerable_species"
    },
    {
      "aggregate": [
        { "op": "sum", "field": "n", "as": "total_species" },
        { "op": "sum", "field": "high_risk_species", "as": "high_risk_total" },
        { "op": "sum", "field": "vulnerable_species", "as": "vulnerable_total" }
      ],
      "groupby": ["group"]
    }
  ],
  "layer": [
    {
      "mark": {
        "type": "circle",
        "filled": true,
        "opacity": 0.78,
        "stroke": "#ffffff",
        "strokeWidth": 1.4
      },
      "encoding": {
        "x": {
          "field": "total_species",
          "type": "quantitative",
          "title": "Total listed animal species",
          "scale": { "domain": [0, 210] }
        },
        "y": {
          "field": "high_risk_total",
          "type": "quantitative",
          "title": "Critically endangered + endangered species",
          "scale": { "domain": [0, 100] }
        },
        "size": {
          "field": "vulnerable_total",
          "type": "quantitative",
          "title": "Vulnerable species",
          "scale": { "type": "sqrt", "range": [180, 2400] },
          "legend": { "orient": "bottom" }
        },
        "color": {
          "field": "group",
          "type": "nominal",
          "title": "Animal group",
          "scale": {
            "domain": ["Birds", "Mammals", "Reptiles", "Amphibians", "Fish", "Sharks & Rays"],
            "range": ["#2a9d8f", "#006d77", "#bb6b3d", "#9b51e0", "#7d98bd", "#d4ad4d"]
          },
          "legend": { "orient": "bottom", "columns": 3 }
        },
        "tooltip": [
          { "field": "group", "type": "nominal", "title": "Animal group" },
          { "field": "total_species", "type": "quantitative", "title": "Total listed species", "format": "," },
          { "field": "high_risk_total", "type": "quantitative", "title": "Critically endangered + endangered", "format": "," },
          { "field": "vulnerable_total", "type": "quantitative", "title": "Vulnerable", "format": "," }
        ]
      }
    },
    {
      "mark": {
        "type": "text",
        "fontSize": 12,
        "fontWeight": "700",
        "dx": 10,
        "color": "#173326"
      },
      "encoding": {
        "x": { "field": "total_species", "type": "quantitative" },
        "y": { "field": "high_risk_total", "type": "quantitative" },
        "text": { "field": "group", "type": "nominal" }
      }
    }
  ],
  "config": baseConfig
};
embed("#animalGroupBubble", animalGroupBubbleSpec);

/* 9. Animal group by state heatmap */
const animalGroupHeatmapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": CHART_WIDTH,
  "height": 300,
  "title": chartTitle(
    "Threatened Animal Groups by State",
    "Heatmap: darker cells show more listed threatened animal species."
  ),
  "data": { "url": DATA_PATH + "animal_group_state.csv" },
  "transform": [
    {
      "impute": "species_count",
      "key": "state",
      "groupby": ["group"],
      "value": 0,
      "keyvals": ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]
    }
  ],
  "layer": [
    {
      "mark": {
        "type": "rect",
        "stroke": "#ffffff",
        "strokeWidth": 2
      },
      "encoding": {
        "x": {
          "field": "state",
          "type": "nominal",
          "title": null,
          "sort": ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"],
          "axis": { "labelAngle": 0 }
        },
        "y": {
          "field": "group",
          "type": "nominal",
          "title": null,
          "sort": ["Mammals", "Birds", "Reptiles", "Amphibians", "Fish", "Sharks & Rays"]
        },
        "color": {
          "field": "species_count",
          "type": "quantitative",
          "title": "Threatened animals",
          "scale": {
            "domain": [0, 100],
            "range": ["#fff7ec", "#fdd49e", "#fc8d59", "#d7301f", "#7f0000"]
          },
          "legend": { "orient": "bottom" }
        },
        "tooltip": [
          { "field": "state", "type": "nominal", "title": "State" },
          { "field": "group", "type": "nominal", "title": "Animal group" },
          { "field": "species_count", "type": "quantitative", "title": "Threatened animal species", "format": "," }
        ]
      }
    },
    {
      "mark": {
        "type": "text",
        "fontSize": 11,
        "fontWeight": "700"
      },
      "encoding": {
        "x": {
          "field": "state",
          "type": "nominal",
          "sort": ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]
        },
        "y": {
          "field": "group",
          "type": "nominal",
          "sort": ["Mammals", "Birds", "Reptiles", "Amphibians", "Fish", "Sharks & Rays"]
        },
        "text": { "field": "species_count", "type": "quantitative", "format": "," },
        "color": {
          "condition": { "test": "datum.species_count >= 50", "value": "#ffffff" },
          "value": "#173326"
        }
      }
    }
  ],
  "config": baseConfig
};
embed("#animalGroupHeatmap", animalGroupHeatmapSpec);

/* 10. Animal threat status stacked percentage chart */
const animalStatusStackSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": CHART_WIDTH,
  "height": 340,
  "title": chartTitle(
    "Threat Severity of Listed Animals by State",
    "Normalised stacked bars compare the share of each EPBC threat status."
  ),
  "data": { "url": DATA_PATH + "animal_state_status.csv" },
  "mark": {
    "type": "bar",
    "cornerRadiusEnd": 2
  },
  "encoding": {
    "x": {
      "field": "state",
      "type": "nominal",
      "title": null,
      "sort": ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"],
      "axis": { "labelAngle": 0 }
    },
    "y": {
      "aggregate": "sum",
      "field": "threatened_animal_species",
      "type": "quantitative",
      "stack": "normalize",
      "title": "Share of listed threatened animals",
      "axis": { "format": ".0%" }
    },
    "color": {
      "field": "epbc_status",
      "type": "nominal",
      "title": "EPBC status",
      "scale": {
        "domain": ["Critically Endangered", "Endangered", "Vulnerable", "Conservation Dependent"],
        "range": ["#8f1d1d", "#e76f51", "#f4a261", "#7d98bd"]
      },
      "legend": { "orient": "bottom", "columns": 2 }
    },
    "order": {
      "field": "status_order",
      "type": "quantitative"
    },
    "tooltip": [
      { "field": "state", "type": "nominal", "title": "State" },
      { "field": "epbc_status", "type": "nominal", "title": "EPBC status" },
      { "field": "threatened_animal_species", "type": "quantitative", "title": "Threatened animal species", "format": "," }
    ]
  },
  "config": baseConfig
};
embed("#animalStatusStack", animalStatusStackSpec);