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
  return {
    "text": text,
    "subtitle": subtitle,
    "fontSize": 18,
    "subtitleFontSize": 12,
    "anchor": "start",
    "offset": 10
  };
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
const largestMapSpec = {
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
embed("#largestMap", largestMapSpec);

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

/* 7. Dumbbell Chart */
const speciesSlopeSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 620,
  "height": 330,
  "title": chartTitle(
    "Species Records Protected by EPBC Status",
    "Slope chart: each line connects terrestrial and marine protection coverage."
  ),
  "data": { "url": DATA_PATH + "species_status_summary_combined.csv" },
  "transform": [
    { "filter": "datum.epbc_status != 'Extinct in the wild'" },
    { "filter": "datum.epbc_status != 'Extinct'" },
    {
      "calculate": "datum.environment == 'terrestrial' ? 'Terrestrial' : 'Marine'",
      "as": "environment_label"
    }
  ],
  "layer": [
    {
      "mark": {
        "type": "line",
        "point": {
          "filled": true,
          "size": 90
        },
        "strokeWidth": 3
      },
      "encoding": {
        "x": {
          "field": "environment_label",
          "type": "nominal",
          "title": null,
          "sort": ["Terrestrial", "Marine"],
          "axis": { "labelAngle": 0, "labelFontSize": 13 }
        },
        "y": {
          "field": "protected_pct",
          "type": "quantitative",
          "title": "Protected species records (%)",
          "scale": { "domain": [0, 80] }
        },
        "color": {
          "field": "epbc_status",
          "type": "nominal",
          "title": "EPBC status",
          "scale": {
            "range": ["#006d77", "#2a9d8f", "#f2c94c", "#e76f51", "#8d8378"]
          },
          "legend": { "orient": "bottom", "columns": 2 }
        },
        "detail": { "field": "epbc_status", "type": "nominal" },
        "tooltip": [
          { "field": "epbc_status", "type": "nominal", "title": "EPBC status" },
          { "field": "environment_label", "type": "nominal", "title": "Environment" },
          { "field": "record_count", "type": "quantitative", "title": "Species records", "format": "," },
          { "field": "protected_pct", "type": "quantitative", "title": "Protected (%)", "format": ".1f" }
        ]
      }
    },
    {
      "transform": [
        { "filter": "datum.environment == 'marine'" }
      ],
      "mark": {
        "type": "text",
        "align": "left",
        "dx": 10,
        "fontSize": 11,
        "fontWeight": "600"
      },
      "encoding": {
        "x": {
          "field": "environment_label",
          "type": "nominal",
          "sort": ["Terrestrial", "Marine"]
        },
        "y": {
          "field": "protected_pct",
          "type": "quantitative"
        },
        "text": {
          "field": "epbc_status",
          "type": "nominal"
        },
        "color": {
          "field": "epbc_status",
          "type": "nominal",
          "scale": {
            "range": ["#006d77", "#2a9d8f", "#f2c94c", "#e76f51", "#8d8378"]
          },
          "legend": null
        }
      }
    }
  ],
  "config": baseConfig
};

embed("#speciesSlope", speciesSlopeSpec);

/* 8. IUCN Bubble Matrix */
/* 8. IUCN Bubble Chart */
const iucnBubbleSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": CHART_WIDTH,
  "height": 380,
  "title": chartTitle(
    "IUCN Category: Count, Total Area and Average Size",
    "Bubble chart: x = number of areas, y = total area, bubble size = average area."
  ),
  "data": { "url": DATA_PATH + "protected_area_iucn_summary.csv" },
  "transform": [
    {
      "calculate": "datum.iucn_category == 'Ia' ? 'Ia - Strict nature reserve' : datum.iucn_category == 'Ib' ? 'Ib - Wilderness area' : datum.iucn_category == 'II' ? 'II - National park' : datum.iucn_category == 'III' ? 'III - Natural monument' : datum.iucn_category == 'IV' ? 'IV - Habitat/species management' : datum.iucn_category == 'V' ? 'V - Protected landscape/seascape' : datum.iucn_category == 'VI' ? 'VI - Sustainable use area' : datum.iucn_category == 'NAS' ? 'Not assigned' : datum.iucn_category == 'NR' ? 'Not reported' : datum.iucn_category",
      "as": "iucn_label"
    }
  ],
  "layer": [
    {
      "mark": {
        "type": "circle",
        "filled": true,
        "opacity": 0.78,
        "color": "#2f7d4f",
        "stroke": "#ffffff",
        "strokeWidth": 1.5
      },
      "encoding": {
        "x": {
          "field": "protected_area_count",
          "type": "quantitative",
          "title": "Number of protected areas",
          "axis": { "format": "," }
        },
        "y": {
          "field": "total_area_ha",
          "type": "quantitative",
          "title": "Total protected area (hectares)",
          "axis": { "format": "~s" }
        },
        "size": {
          "field": "mean_area_ha",
          "type": "quantitative",
          "title": "Average area per protected area (ha)",
          "scale": { "type": "sqrt", "range": [120, 2200] },
          "legend": {
            "orient": "bottom",
            "format": "~s"
          }
        },
        "tooltip": [
          { "field": "iucn_label", "type": "nominal", "title": "IUCN category" },
          { "field": "protected_area_count", "type": "quantitative", "title": "Number of protected areas", "format": "," },
          { "field": "total_area_ha", "type": "quantitative", "title": "Total area (ha)", "format": ",.0f" },
          { "field": "mean_area_ha", "type": "quantitative", "title": "Average area (ha)", "format": ",.0f" },
          { "field": "share_of_national_protected_area_pct", "type": "quantitative", "title": "Share of national area (%)", "format": ".1f" }
        ]
      }
    },
    {
      "mark": {
        "type": "text",
        "align": "left",
        "dx": 9,
        "fontSize": 11,
        "fontWeight": "700",
        "color": "#173326"
      },
      "encoding": {
        "x": { "field": "protected_area_count", "type": "quantitative" },
        "y": { "field": "total_area_ha", "type": "quantitative" },
        "text": { "field": "iucn_category", "type": "nominal" }
      }
    }
  ],
  "config": baseConfig
};

embed("#iucnBubble", iucnBubbleSpec);

/* 9. Stacked Bar Chart */
const communityHeatmapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 620,
  "height": 260,
  "title": chartTitle(
    "Threatened Ecological Communities by State",
    "Heatmap: darker cells show more listed ecological communities."
  ),
  "data": { "url": DATA_PATH + "threatened_communities_by_state.csv" },
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
      "field": "epbc_status",
      "type": "nominal",
      "title": null,
      "sort": ["Critically Endangered", "Endangered", "Vulnerable"]
    },
    "color": {
      "field": "community_count",
      "type": "quantitative",
      "title": "Communities",
      "scale": { "scheme": "orangered" },
      "legend": { "orient": "bottom" }
    },
    "tooltip": [
      { "field": "state", "type": "nominal", "title": "State" },
      { "field": "epbc_status", "type": "nominal", "title": "EPBC status" },
      { "field": "community_count", "type": "quantitative", "title": "Communities", "format": "," }
    ]
  },
  "config": baseConfig
};

embed("#communityHeatmap", communityHeatmapSpec);

/* 10. Bin Map */
const densityMapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 620,
  "height": 520,
  "title": chartTitle(
    "Protected Area Density Grid",
    "Bin map: darker cells mean more protected areas, not more protected hectares."
  ),
  "projection": mapProjection,
  "layer": [
    australiaBase,
    {
      "data": { "url": DATA_PATH + "protected_areas_points.csv" },
      "transform": [
        { "calculate": "floor(datum.longitude * 2) / 2 + 0.25", "as": "lon_bin" },
        { "calculate": "floor(datum.latitude * 2) / 2 + 0.25", "as": "lat_bin" },
        {
          "aggregate": [
            { "op": "count", "as": "protected_area_count" },
            { "op": "sum", "field": "area_ha", "as": "total_area_ha" }
          ],
          "groupby": ["lon_bin", "lat_bin"]
        }
      ],
      "mark": { "type": "square", "filled": true, "size": 110, "opacity": 0.92 },
      "encoding": {
        "longitude": { "field": "lon_bin", "type": "quantitative" },
        "latitude": { "field": "lat_bin", "type": "quantitative" },
        "color": {
          "field": "protected_area_count",
          "type": "quantitative",
          "title": "Number of protected areas",
          "scale": { "scheme": "blues", "domain": [1, 300] },
          "legend": { "orient": "bottom" }
        },
        "tooltip": [
          { "field": "protected_area_count", "type": "quantitative", "title": "Protected areas in cell", "format": "," },
          { "field": "total_area_ha", "type": "quantitative", "title": "Total area in cell (ha)", "format": ",.0f" }
        ]
      }
    }
  ],
  "config": baseConfig
};
embed("#densityMap", densityMapSpec);