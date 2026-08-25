import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import {
  Box,
  GitBranch,
  Loader2,
  Search,
  TriangleAlert,
  Workflow,
  X,
} from "lucide-react";

const CLASS_NODE_WIDTH = 320;
const CLASS_NODE_HEIGHT = 190;

const GROUP_PADDING_X = 40;
const GROUP_PADDING_TOP = 92;
const GROUP_PADDING_BOTTOM = 40;
const GROUP_GAP_X = 72;
const GROUP_GAP_Y = 96;

/*
 * 주변 보기 전용 레이아웃 설정입니다.
 * 선택 노드를 중앙에 두고, 들어오는 관계는 왼쪽, 나가는 관계는 오른쪽에 배치합니다.
 */
const NEIGHBOR_SIDE_GAP_X = 560;
const NEIGHBOR_GAP_Y = 90;
const NEIGHBOR_COLUMN_GAP_X = 90;
const NEIGHBOR_PER_COLUMN = 4;

const GROUP_MODE = {
  PACKAGE: "PACKAGE",
  LAYER: "LAYER",
};

const FOCUS_MODE = {
  ALL: "ALL",
  ENTRY_POINT: "ENTRY_POINT",
  EXTENSION_POINT: "EXTENSION_POINT",
};

const VIEW_MODE = {
  OVERVIEW: "OVERVIEW",
  NEIGHBORHOOD: "NEIGHBORHOOD",
};

const DEFAULT_VISIBLE_EDGE_TYPES = {
  EXTENDS: true,
  IMPLEMENTS: true,
  PARAM: true,
  RETURNS: true,
};

const EDGE_META = {
  EXTENDS: {
    label: "상속",
    stroke: "#c084fc",
    dasharray: undefined,
    markerType: MarkerType.ArrowClosed,
  },
  IMPLEMENTS: {
    label: "구현",
    stroke: "#67e8f9",
    dasharray: "8 5",
    markerType: MarkerType.ArrowClosed,
  },
  PARAM: {
    label: "입력 의존",
    stroke: "#6ee7b7",
    dasharray: "5 5",
    markerType: MarkerType.Arrow,
  },
  RETURNS: {
    label: "반환 의존",
    stroke: "#fde68a",
    dasharray: "5 5",
    markerType: MarkerType.Arrow,
  },
};

const LAYER_META = {
  PRESENTATION: {
    id: "layer:presentation",
    label: "presentation",
    order: 10,
    accentColor: "#38bdf8",
  },
  DTO: {
    id: "layer:dto",
    label: "dto",
    order: 15,
    accentColor: "#818cf8",
  },
  SERVICE: {
    id: "layer:service",
    label: "service",
    order: 20,
    accentColor: "#c084fc",
  },
  REPOSITORY: {
    id: "layer:repository",
    label: "repository",
    order: 30,
    accentColor: "#34d399",
  },
  DOMAIN: {
    id: "layer:domain",
    label: "domain",
    order: 40,
    accentColor: "#fbbf24",
  },
  CONFIG: {
    id: "layer:config",
    label: "config",
    order: 50,
    accentColor: "#22d3ee",
  },
  EXCEPTION: {
    id: "layer:exception",
    label: "exception",
    order: 60,
    accentColor: "#fb7185",
  },
  SUPPORT: {
    id: "layer:support",
    label: "support",
    order: 70,
    accentColor: "#94a3b8",
  },
  OTHER: {
    id: "layer:other",
    label: "other",
    order: 80,
    accentColor: "#64748b",
  },
};

function formatScore(score) {
  if (score === null || score === undefined) {
    return "-";
  }

  if (typeof score === "number") {
    return score.toFixed(1);
  }

  return String(score);
}

function shortPackageName(packageName) {
  if (!packageName) {
    return "default";
  }

  const tokens = packageName.split(".");

  if (tokens.length <= 3) {
    return packageName;
  }

  return `…${tokens.slice(-3).join(".")}`;
}

function packageGroupLabel(packageName) {
  if (!packageName) {
    return "default";
  }

  const tokens = packageName.split(".");
  return tokens[tokens.length - 1];
}

function badgeClassName(badge) {
  switch (normalizeBadgeKey(badge)) {
    case "start_here":
    case "entrypoint":
    case "entry_point":
      return "border-purple-400/30 bg-purple-400/10 text-purple-200";
    case "extension_point":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-200";
    case "input_model":
      return "border-blue-400/30 bg-blue-400/10 text-blue-200";
    case "output_model":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "config":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
    default:
      return "border-white/10 bg-white/5 text-gray-300";
  }
}

function normalizeBadgeKey(badge) {
  return String(badge ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");
}

function badgeLabel(badge) {
  const normalized = normalizeBadgeKey(badge);

  switch (normalized) {
    case "start_here":
    case "entrypoint":
    case "entry_point":
      return "진입점";
    case "publicapi":
    case "public_api":
      return "공개 API";
    case "api_flow":
      return "API 흐름";
    case "api_flow_trace":
      return "API 흐름 추적";
    case "flow_trace":
      return "흐름 추적";
    case "extension_point":
      return "확장 지점";
    case "input_model":
      return "입력 모델";
    case "output_model":
      return "출력 모델";
    case "config":
      return "설정";
    case "super_cluster":
    case "supercluster":
      return "상위 군집";
    case "cluster":
      return "군집";
    case "controller":
      return "컨트롤러";
    case "service":
      return "서비스";
    case "repository":
      return "저장소 계층";
    case "entity":
      return "엔티티";
    case "dto":
      return "전송 모델";
    case "utility":
    case "util":
      return "유틸리티";
    case "factory":
      return "생성 팩토리";
    case "adapter":
      return "어댑터";
    case "handler":
      return "처리기";
    default:
      return humanizeTechnicalLabel(badge);
  }
}

function humanizeTechnicalLabel(value) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "-";
  }

  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
}

function isEntryPoint(node) {
  return node.badges?.some((badge) =>
    ["start_here", "entrypoint", "entry_point"].includes(normalizeBadgeKey(badge))
  );
}

function isExtensionPoint(node) {
  return node.badges?.some((badge) => normalizeBadgeKey(badge) === "extension_point");
}

function isFocusedNode(node, focusMode) {
  if (focusMode === FOCUS_MODE.ALL) {
    return true;
  }

  if (focusMode === FOCUS_MODE.ENTRY_POINT) {
    return isEntryPoint(node);
  }

  if (focusMode === FOCUS_MODE.EXTENSION_POINT) {
    return isExtensionPoint(node);
  }

  return true;
}

function tokenize(text) {
  if (!text) {
    return [];
  }

  return text
    .toLowerCase()
    .split(/[.\-_/$]/)
    .filter(Boolean);
}

function hasAny(tokens, candidates) {
  return candidates.some((candidate) => tokens.includes(candidate));
}

function inferLayer(node) {
  const packageTokens = tokenize(node.packageName);
  const simpleName = (node.label ?? "").toLowerCase();

  if (
    hasAny(packageTokens, [
      "controller",
      "controllers",
      "web",
      "api",
      "rest",
      "endpoint",
      "endpoints",
    ]) ||
    /(controller|resource|endpoint|handler)$/.test(simpleName)
  ) {
    return LAYER_META.PRESENTATION;
  }

  if (
    hasAny(packageTokens, [
      "dto",
      "request",
      "requests",
      "response",
      "responses",
      "payload",
      "command",
      "commands",
      "query",
      "queries",
    ]) ||
    /(dto|request|response|command|query)$/.test(simpleName)
  ) {
    return LAYER_META.DTO;
  }

  if (
    hasAny(packageTokens, [
      "service",
      "services",
      "application",
      "usecase",
      "usecases",
      "facade",
    ]) ||
    /(service|facade|usecase)$/.test(simpleName)
  ) {
    return LAYER_META.SERVICE;
  }

  if (
    hasAny(packageTokens, [
      "repository",
      "repositories",
      "dao",
      "persistence",
      "store",
    ]) ||
    /(repository|dao)$/.test(simpleName)
  ) {
    return LAYER_META.REPOSITORY;
  }

  if (
    hasAny(packageTokens, [
      "domain",
      "model",
      "models",
      "entity",
      "entities",
      "aggregate",
      "aggregates",
      "vo",
    ])
  ) {
    return LAYER_META.DOMAIN;
  }

  if (
    hasAny(packageTokens, ["config", "configuration", "security"]) ||
    /(config|configuration)$/.test(simpleName)
  ) {
    return LAYER_META.CONFIG;
  }

  if (
    hasAny(packageTokens, ["exception", "exceptions", "error", "errors"]) ||
    /(exception|error)$/.test(simpleName)
  ) {
    return LAYER_META.EXCEPTION;
  }

  if (
    hasAny(packageTokens, [
      "common",
      "util",
      "utils",
      "support",
      "helper",
      "helpers",
    ])
  ) {
    return LAYER_META.SUPPORT;
  }

  return LAYER_META.OTHER;
}

function createPackageDescriptor(node) {
  const packageName = node.packageName || "default";

  return {
    id: `group:package:${packageName}`,
    label: packageGroupLabel(packageName),
    fullName: packageName,
    packageName,
    groupMode: GROUP_MODE.PACKAGE,
    order: packageName,
    accentColor: "#64748b",
  };
}

function createLayerDescriptor(node) {
  const layer = inferLayer(node);

  return {
    id: `group:${layer.id}`,
    label: layer.label,
    fullName: layer.label,
    packageName: null,
    groupMode: GROUP_MODE.LAYER,
    order: layer.order,
    accentColor: layer.accentColor,
  };
}

function groupNodesByMode(diagramNodes, groupMode) {
  const groups = new Map();

  diagramNodes.forEach((node) => {
    const descriptor =
      groupMode === GROUP_MODE.PACKAGE
        ? createPackageDescriptor(node)
        : createLayerDescriptor(node);

    if (!groups.has(descriptor.id)) {
      groups.set(descriptor.id, {
        ...descriptor,
        nodes: [],
      });
    }

    groups.get(descriptor.id).nodes.push(node);
  });

  return [...groups.values()].sort((a, b) => {
    if (groupMode === GROUP_MODE.LAYER) {
      return a.order - b.order;
    }

    return String(a.order).localeCompare(String(b.order));
  });
}

function normalizeVisibleEdges(diagramEdges, visibleEdgeTypes, validNodeIds) {
  return diagramEdges
    .filter((edge) => visibleEdgeTypes[edge.edgeType])
    .map((edge, index) => {
      const source = String(edge.sourceSymbolId);
      const target = String(edge.targetSymbolId);

      return {
        ...edge,
        id: `${edge.edgeType}-${source}-${target}-${index}`,
        source,
        target,
        _index: index,
      };
    })
    .filter(
      (edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
    );
}

function buildNeighborhoodNodeIds(normalizedEdges, selectedNodeId) {
  const neighborhood = new Set();

  if (!selectedNodeId) {
    return neighborhood;
  }

  neighborhood.add(selectedNodeId);

  normalizedEdges.forEach((edge) => {
    if (edge.source === selectedNodeId) {
      neighborhood.add(edge.target);
    }

    if (edge.target === selectedNodeId) {
      neighborhood.add(edge.source);
    }
  });

  return neighborhood;
}

function buildScopedGraph(
  diagramNodes,
  diagramEdges,
  visibleEdgeTypes,
  viewMode,
  selectedNodeId
) {
  const allNodeIds = new Set(diagramNodes.map((node) => String(node.symbolId)));

  const allVisibleEdges = normalizeVisibleEdges(
    diagramEdges,
    visibleEdgeTypes,
    allNodeIds
  );

  if (viewMode !== VIEW_MODE.NEIGHBORHOOD || !selectedNodeId) {
    return {
      scopedNodes: diagramNodes,
      scopedEdges: allVisibleEdges,
      allVisibleEdges,
      neighborhoodNodeIds: new Set(),
    };
  }

  const neighborhoodNodeIds = buildNeighborhoodNodeIds(
    allVisibleEdges,
    selectedNodeId
  );

  const scopedNodes = diagramNodes.filter((node) =>
    neighborhoodNodeIds.has(String(node.symbolId))
  );

  const scopedEdges = allVisibleEdges.filter(
    (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
  );

  return {
    scopedNodes,
    scopedEdges,
    allVisibleEdges,
    neighborhoodNodeIds,
  };
}

function buildChildNodesForGroup(
  group,
  direction,
  focusMode,
  viewMode,
  selectedNodeId,
  neighborhoodNodeIds
) {
  const count = group.nodes.length;
  const maxColumns = group.groupMode === GROUP_MODE.LAYER ? 3 : 2;

  const columns = Math.min(
    maxColumns,
    Math.max(1, Math.ceil(Math.sqrt(count)))
  );

  const rows = Math.ceil(count / columns);

  const width =
    GROUP_PADDING_X * 2 +
    columns * CLASS_NODE_WIDTH +
    Math.max(0, columns - 1) * GROUP_GAP_X;

  const height =
    GROUP_PADDING_TOP +
    GROUP_PADDING_BOTTOM +
    rows * CLASS_NODE_HEIGHT +
    Math.max(0, rows - 1) * GROUP_GAP_Y;

  const children = group.nodes.map((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const nodeId = String(node.symbolId);

    const isSelected = selectedNodeId === nodeId;
    const isRelatedToSelection =
      viewMode === VIEW_MODE.NEIGHBORHOOD &&
      selectedNodeId &&
      neighborhoodNodeIds.has(nodeId);

    const isDimmedByFocusMode =
      viewMode === VIEW_MODE.OVERVIEW &&
      focusMode !== FOCUS_MODE.ALL &&
      !isFocusedNode(node, focusMode);

    return {
      id: nodeId,
      type: "umlClass",
      parentId: group.id,
      extent: "parent",
      zIndex: 3,
      position: {
        x: GROUP_PADDING_X + col * (CLASS_NODE_WIDTH + GROUP_GAP_X),
        y: GROUP_PADDING_TOP + row * (CLASS_NODE_HEIGHT + GROUP_GAP_Y),
      },
      data: {
        label: node.label,
        access: node.access,
        packageName: node.packageName,
        qualifiedName: node.qualifiedName,
        score: node.score,
        badges: node.badges ?? [],
        reasons: node.reasons ?? [],
        handleDirection: direction,
        isEntryPoint: isEntryPoint(node),
        isExtensionPoint: isExtensionPoint(node),
        isSelected,
        isRelatedToSelection,
        isDimmed: isDimmedByFocusMode,
      },
    };
  });

  return {
    width,
    height,
    children,
  };
}

function createNeighborhoodClassNode(
  node,
  position,
  selectedNodeId,
  neighborhoodNodeIds
) {
  const nodeId = String(node.symbolId);
  const isSelected = selectedNodeId === nodeId;
  const isRelatedToSelection = selectedNodeId && neighborhoodNodeIds.has(nodeId);

  return {
    id: nodeId,
    type: "umlClass",
    zIndex: isSelected ? 5 : 4,
    position,
    data: {
      label: node.label,
      access: node.access,
      packageName: node.packageName,
      qualifiedName: node.qualifiedName,
      score: node.score,
      badges: node.badges ?? [],
      reasons: node.reasons ?? [],

      /*
       * 주변 보기는 좌우 배치가 핵심이므로 핸들도 좌우로 고정합니다.
       */
      handleDirection: "LR",

      isEntryPoint: isEntryPoint(node),
      isExtensionPoint: isExtensionPoint(node),
      isSelected,
      isRelatedToSelection,
      isDimmed: false,
    },
  };
}

function sortNeighborhoodNodes(nodes) {
  return [...nodes].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return String(a.label ?? "").localeCompare(String(b.label ?? ""));
  });
}

function layoutNeighborhoodStack(nodes, side) {
  const sign = side === "left" ? -1 : 1;

  return nodes.map((node, index) => {
    const column = Math.floor(index / NEIGHBOR_PER_COLUMN);
    const row = index % NEIGHBOR_PER_COLUMN;

    const startIndex = column * NEIGHBOR_PER_COLUMN;
    const rowsInColumn = Math.min(
      NEIGHBOR_PER_COLUMN,
      nodes.length - startIndex
    );

    const x =
      sign *
      (NEIGHBOR_SIDE_GAP_X +
        column * (CLASS_NODE_WIDTH + NEIGHBOR_COLUMN_GAP_X));

    const y =
      (row - (rowsInColumn - 1) / 2) *
      (CLASS_NODE_HEIGHT + NEIGHBOR_GAP_Y);

    return {
      node,
      position: {
        x,
        y,
      },
    };
  });
}

function layoutNeighborhoodBottom(nodes) {
  return nodes.map((node, index) => {
    const x =
      (index - (nodes.length - 1) / 2) *
      (CLASS_NODE_WIDTH + NEIGHBOR_COLUMN_GAP_X);

    return {
      node,
      position: {
        x,
        y: CLASS_NODE_HEIGHT + 360,
      },
    };
  });
}

function toFlowEdges(scopedEdges, selectedNodeId, viewMode) {
  return scopedEdges.map((edge) => {
    const meta = EDGE_META[edge.edgeType] ?? EDGE_META.PARAM;
    const isStructural =
      edge.edgeType === "EXTENDS" || edge.edgeType === "IMPLEMENTS";

    const isNeighborhoodMode =
      viewMode === VIEW_MODE.NEIGHBORHOOD && selectedNodeId;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: false,
      zIndex: 1,
      style: {
        stroke: meta.stroke,
        strokeWidth: isNeighborhoodMode
          ? isStructural
            ? 3.4
            : 2.6
          : isStructural
            ? 2.6
            : 1.9,
        strokeDasharray: meta.dasharray,
      },
      markerEnd: {
        type: meta.markerType,
        color: meta.stroke,
        width: isNeighborhoodMode
          ? isStructural
            ? 28
            : 21
          : isStructural
            ? 24
            : 18,
        height: isNeighborhoodMode
          ? isStructural
            ? 28
            : 21
          : isStructural
            ? 24
            : 18,
      },
      interactionWidth: 18,
      data: {
        original: edge,
      },
    };
  });
}

function buildNeighborhoodLayout(
  scopedNodes,
  scopedEdges,
  allVisibleEdges,
  neighborhoodNodeIds,
  selectedNodeId
) {
  const selectedNode = scopedNodes.find(
    (node) => String(node.symbolId) === selectedNodeId
  );

  if (!selectedNode) {
    return {
      nodes: [],
      edges: [],
      groups: [],
      scopedNodes,
      scopedEdges,
      allVisibleEdges,
    };
  }

  const incomingIds = new Set();
  const outgoingIds = new Set();

  scopedEdges.forEach((edge) => {
    if (edge.source === selectedNodeId) {
      outgoingIds.add(edge.target);
    }

    if (edge.target === selectedNodeId) {
      incomingIds.add(edge.source);
    }
  });

  const relatedNodes = scopedNodes.filter(
    (node) => String(node.symbolId) !== selectedNodeId
  );

  const incomingNodes = sortNeighborhoodNodes(
    relatedNodes.filter((node) => {
      const id = String(node.symbolId);
      return incomingIds.has(id) && !outgoingIds.has(id);
    })
  );

  const outgoingNodes = sortNeighborhoodNodes(
    relatedNodes.filter((node) => {
      const id = String(node.symbolId);
      return outgoingIds.has(id);
    })
  );

  const bottomNodes = sortNeighborhoodNodes(
    relatedNodes.filter((node) => {
      const id = String(node.symbolId);
      return !incomingIds.has(id) && !outgoingIds.has(id);
    })
  );

  const selectedFlowNode = createNeighborhoodClassNode(
    selectedNode,
    { x: 0, y: 0 },
    selectedNodeId,
    neighborhoodNodeIds
  );

  const incomingFlowNodes = layoutNeighborhoodStack(incomingNodes, "left").map(
    ({ node, position }) =>
      createNeighborhoodClassNode(
        node,
        position,
        selectedNodeId,
        neighborhoodNodeIds
      )
  );

  const outgoingFlowNodes = layoutNeighborhoodStack(outgoingNodes, "right").map(
    ({ node, position }) =>
      createNeighborhoodClassNode(
        node,
        position,
        selectedNodeId,
        neighborhoodNodeIds
      )
  );

  const bottomFlowNodes = layoutNeighborhoodBottom(bottomNodes).map(
    ({ node, position }) =>
      createNeighborhoodClassNode(
        node,
        position,
        selectedNodeId,
        neighborhoodNodeIds
      )
  );

  return {
    nodes: [
      selectedFlowNode,
      ...incomingFlowNodes,
      ...outgoingFlowNodes,
      ...bottomFlowNodes,
    ],
    edges: toFlowEdges(scopedEdges, selectedNodeId, VIEW_MODE.NEIGHBORHOOD),
    groups: [],
    scopedNodes,
    scopedEdges,
    allVisibleEdges,
  };
}

function buildGroupEdges(scopedEdges, nodeToGroupMap) {
  const seen = new Set();
  const groupEdges = [];

  scopedEdges.forEach((edge) => {
    const sourceGroup = nodeToGroupMap.get(edge.source);
    const targetGroup = nodeToGroupMap.get(edge.target);

    if (!sourceGroup || !targetGroup || sourceGroup === targetGroup) {
      return;
    }

    const key = `${sourceGroup}->${targetGroup}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);

    groupEdges.push({
      source: sourceGroup,
      target: targetGroup,
    });
  });

  return groupEdges;
}

function layoutPackageGroups(groups, groupEdges, direction) {
  if (groupEdges.length === 0) {
    return buildFallbackGroupGrid(groups);
  }

  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: direction,
    ranksep: 180,
    nodesep: 120,
    edgesep: 60,
    marginx: 50,
    marginy: 50,
  });

  groups.forEach((group) => {
    graph.setNode(group.id, {
      width: group.width,
      height: group.height,
    });
  });

  groupEdges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return groups.map((group) => {
    const position = graph.node(group.id);

    return {
      ...group,
      x: position.x - group.width / 2,
      y: position.y - group.height / 2,
    };
  });
}

function layoutLayerGroups(groups, direction) {
  const sorted = [...groups].sort((a, b) => a.order - b.order);

  if (direction === "TB") {
    const maxWidth = Math.max(...sorted.map((group) => group.width));
    let currentY = 0;

    return sorted.map((group) => {
      const positioned = {
        ...group,
        x: (maxWidth - group.width) / 2,
        y: currentY,
      };

      currentY += group.height + 160;

      return positioned;
    });
  }

  const maxHeight = Math.max(...sorted.map((group) => group.height));
  let currentX = 0;

  return sorted.map((group) => {
    const positioned = {
      ...group,
      x: currentX,
      y: (maxHeight - group.height) / 2,
    };

    currentX += group.width + 160;

    return positioned;
  });
}

function buildFallbackGroupGrid(groups) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(groups.length)));
  const gapX = 140;
  const gapY = 140;

  let currentY = 0;
  const rows = [];

  for (let i = 0; i < groups.length; i += columns) {
    rows.push(groups.slice(i, i + columns));
  }

  const positioned = [];

  rows.forEach((row) => {
    const rowHeight = Math.max(...row.map((group) => group.height));
    let currentX = 0;

    row.forEach((group) => {
      positioned.push({
        ...group,
        x: currentX,
        y: currentY,
      });

      currentX += group.width + gapX;
    });

    currentY += rowHeight + gapY;
  });

  return positioned;
}

function buildGroupedLayout(
  diagramNodes,
  diagramEdges,
  visibleEdgeTypes,
  direction,
  groupMode,
  focusMode,
  viewMode,
  selectedNodeId
) {
  const {
    scopedNodes,
    scopedEdges,
    allVisibleEdges,
    neighborhoodNodeIds,
  } = buildScopedGraph(
    diagramNodes,
    diagramEdges,
    visibleEdgeTypes,
    viewMode,
    selectedNodeId
  );

  /*
   * 핵심 변경:
   * 주변 보기에서는 package/layer 그룹을 제거하고,
   * 선택 노드 중심의 전용 레이아웃을 사용합니다.
   */
  if (viewMode === VIEW_MODE.NEIGHBORHOOD && selectedNodeId) {
    return buildNeighborhoodLayout(
      scopedNodes,
      scopedEdges,
      allVisibleEdges,
      neighborhoodNodeIds,
      selectedNodeId
    );
  }

  const groups = groupNodesByMode(scopedNodes, groupMode);

  const nodeToGroupMap = new Map();

  groups.forEach((group) => {
    group.nodes.forEach((node) => {
      nodeToGroupMap.set(String(node.symbolId), group.id);
    });
  });

  const groupsWithChildren = groups.map((group) => {
    const { width, height, children } = buildChildNodesForGroup(
      group,
      direction,
      focusMode,
      viewMode,
      selectedNodeId,
      neighborhoodNodeIds
    );

    return {
      ...group,
      width,
      height,
      children,
    };
  });

  const groupEdges = buildGroupEdges(scopedEdges, nodeToGroupMap);

  const layoutedGroups =
    groupMode === GROUP_MODE.LAYER
      ? layoutLayerGroups(groupsWithChildren, direction)
      : layoutPackageGroups(groupsWithChildren, groupEdges, direction);

  const parentNodes = layoutedGroups.map((group) => ({
    id: group.id,
    type: "diagramGroup",
    position: {
      x: group.x,
      y: group.y,
    },
    zIndex: 0,
    data: {
      label: group.label,
      fullName: group.fullName,
      groupMode: group.groupMode,
      count: group.nodes.length,
      accentColor: group.accentColor,
    },
    style: {
      width: group.width,
      height: group.height,
    },
    selectable: false,
    draggable: false,
  }));

  const childNodes = layoutedGroups.flatMap((group) =>
    group.children.map((child) => ({
      ...child,
      data: {
        ...child.data,
        handleDirection: direction,
      },
    }))
  );

  return {
    nodes: [...parentNodes, ...childNodes],
    edges: toFlowEdges(scopedEdges, selectedNodeId, viewMode),
    groups: layoutedGroups,
    scopedNodes,
    scopedEdges,
    allVisibleEdges,
  };
}

function UmlClassNode({ data }) {
  const badges = data.badges ?? [];
  const isTopBottom = data.handleDirection === "TB";

  const focusClassName = data.isSelected
    ? "border-white"
    : data.isRelatedToSelection
      ? "border-cyan-200"
      : data.isDimmed
        ? "border-white/5 opacity-[0.08] grayscale"
        : data.isEntryPoint && data.isExtensionPoint
          ? "border-fuchsia-300"
          : data.isEntryPoint
            ? "border-purple-300"
            : data.isExtensionPoint
              ? "border-yellow-300"
              : "border-white/15";

  return (
    <div
      className={`relative z-[3] w-[320px] overflow-hidden rounded-xl border bg-[#0b1020]/95 transition-all duration-200 ${focusClassName}`}
    >
      <Handle
        type="target"
        position={isTopBottom ? Position.Top : Position.Left}
        className="!h-2.5 !w-2.5 !border-0 !bg-cyan-300"
      />
      <Handle
        type="source"
        position={isTopBottom ? Position.Bottom : Position.Right}
        className="!h-2.5 !w-2.5 !border-0 !bg-cyan-300"
      />

      <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3">
        <p className="text-[11px] text-gray-500" title={data.packageName}>
          {shortPackageName(data.packageName)}
        </p>

        <div className="mt-1 flex min-h-[42px] items-start justify-between gap-3">
          <h4
            className="min-w-0 flex-1 whitespace-normal break-words text-[15px] font-bold leading-5 text-gray-100"
            title={data.qualifiedName}
          >
            {data.label}
          </h4>

          <span className="mt-0.5 shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
            {data.access ?? "UNKNOWN"}
          </span>
        </div>
      </div>

      <div className="min-h-[58px] border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500">score</span>
          <span className="font-semibold text-gray-200">
            {formatScore(data.score)}
          </span>
        </div>

        {badges.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeClassName(
                  badge
                )}`}
              >
                {badgeLabel(badge)}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-gray-600">no role badge</p>
        )}
      </div>


    </div>
  );
}

function DiagramGroupNode({ data }) {
  return (
    <div
      className="h-full w-full rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]"
      style={{
        borderColor: `${data.accentColor}55`,
      }}
      title={data.fullName}
    >
      <div className="flex h-[58px] items-center justify-between rounded-t-2xl border-b border-white/10 bg-white/[0.04] px-5">
        <div className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: data.accentColor }}
          />

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {data.groupMode === GROUP_MODE.PACKAGE ? "package" : "layer"}
            </p>
            <p className="font-semibold text-gray-200">{data.label}</p>
          </div>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-gray-400">
          {data.count} types
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  umlClass: UmlClassNode,
  diagramGroup: DiagramGroupNode,
};

function LegendItem({ edgeType }) {
  const meta = EDGE_META[edgeType];

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span
        className="inline-block h-0.5 w-7"
        style={{
          backgroundColor: meta.stroke,
          borderTop:
            meta.dasharray !== undefined
              ? `1px dashed ${meta.stroke}`
              : undefined,
        }}
      />
      <span>{meta.label}</span>
    </div>
  );
}

function EdgeToggle({ edgeType, checked, count, onChange }) {
  const meta = EDGE_META[edgeType];
  const disabled = count === 0;

  return (
    <label
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-gray-600"
          : "cursor-pointer border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(edgeType)}
        className="accent-cyan-300"
      />
      <span>{meta.label}</span>
      <span className="text-[10px] text-gray-500">{count}</span>
    </label>
  );
}

function LayoutToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-1">
      <button
        type="button"
        onClick={() => onChange("TB")}
        className={`rounded-md px-3 py-1.5 text-xs transition ${
          value === "TB"
            ? "bg-cyan-400/15 text-cyan-200"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        위 → 아래
      </button>

      <button
        type="button"
        onClick={() => onChange("LR")}
        className={`rounded-md px-3 py-1.5 text-xs transition ${
          value === "LR"
            ? "bg-cyan-400/15 text-cyan-200"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        왼쪽 → 오른쪽
      </button>
    </div>
  );
}

function GroupModeToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-1">
      <button
        type="button"
        onClick={() => onChange(GROUP_MODE.PACKAGE)}
        className={`rounded-md px-3 py-1.5 text-xs transition ${
          value === GROUP_MODE.PACKAGE
            ? "bg-purple-400/15 text-purple-200"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        Package 기준
      </button>

      <button
        type="button"
        onClick={() => onChange(GROUP_MODE.LAYER)}
        className={`rounded-md px-3 py-1.5 text-xs transition ${
          value === GROUP_MODE.LAYER
            ? "bg-purple-400/15 text-purple-200"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        Layer 기준
      </button>
    </div>
  );
}

function FocusModeToggle({
  value,
  onChange,
  entryPointCount,
  extensionPointCount,
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-1">
      <button
        type="button"
        onClick={() => onChange(FOCUS_MODE.ALL)}
        className={`rounded-md px-3 py-1.5 text-xs transition ${
          value === FOCUS_MODE.ALL
            ? "bg-white/10 text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        전체
      </button>

      <button
        type="button"
        onClick={() => onChange(FOCUS_MODE.ENTRY_POINT)}
        className={`rounded-md px-3 py-1.5 text-xs transition ${
          value === FOCUS_MODE.ENTRY_POINT
            ? "bg-purple-400/15 text-purple-200"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        진입점 {entryPointCount}
      </button>

      <button
        type="button"
        onClick={() => onChange(FOCUS_MODE.EXTENSION_POINT)}
        className={`rounded-md px-3 py-1.5 text-xs transition ${
          value === FOCUS_MODE.EXTENSION_POINT
            ? "bg-yellow-400/15 text-yellow-200"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        확장점 {extensionPointCount}
      </button>
    </div>
  );
}

function SearchBox({
  searchTerm,
  onChange,
  onClear,
  results,
  onSelect,
  onSubmit,
}) {
  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <Search size={16} className="shrink-0 text-gray-500" />

        <input
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit();
            }
          }}
          placeholder="클래스명 검색"
          className="w-full bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-600"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1 text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {searchTerm.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-white/10 bg-[#0b1020] shadow-2xl">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">
              검색 결과가 없습니다.
            </p>
          ) : (
            results.map((node) => (
              <button
                key={`search-${node.symbolId}`}
                type="button"
                onClick={() => onSelect(node)}
                className="flex w-full items-start justify-between gap-3 border-b border-white/5 px-3 py-3 text-left transition last:border-b-0 hover:bg-white/[0.05]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-100">
                    {node.label}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {shortPackageName(node.packageName)}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-400">
                  {formatScore(node.score)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ViewportController({ request }) {
  const reactFlow = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (!nodesInitialized || !request) {
      return;
    }

    const targetNodes =
      request.nodeIds?.length > 0
        ? request.nodeIds.map((id) => ({ id }))
        : undefined;

    const runFitView = (duration = 500) => {
      reactFlow.fitView({
        nodes: targetNodes,
        padding: request.padding,
        duration,
        minZoom: request.minZoom,
        maxZoom: request.maxZoom,
      });
    };

    const fitTimers = [80, ...(request.retryDelays ?? [])].map((delay) =>
      window.setTimeout(() => runFitView(delay === 80 ? 500 : 300), delay)
    );

    /*
     * 주변 보기에서는 fitView 이후 선택 노드를 다시 중앙에 두고
     * 읽기 쉬운 확대율까지 한 번 더 조정합니다.
     */
    const centerTimer = window.setTimeout(() => {
      if (!request.centerNodeId || !request.focusZoom) {
        return;
      }

      const node = reactFlow.getNode(request.centerNodeId);

      if (!node) {
        return;
      }

      const absolutePosition =
        node.positionAbsolute ??
        node.internals?.positionAbsolute ??
        node.position;

      const width = node.measured?.width ?? node.width ?? CLASS_NODE_WIDTH;
      const height = node.measured?.height ?? node.height ?? CLASS_NODE_HEIGHT;

      const centerX = absolutePosition.x + width / 2;
      const centerY = absolutePosition.y + height / 2;

      const currentZoom = reactFlow.getZoom();
      const nextZoom = Math.max(currentZoom, request.focusZoom);

      reactFlow.setCenter(centerX, centerY, {
        zoom: nextZoom,
        duration: 450,
      });
    }, 650);

    return () => {
      fitTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(centerTimer);
    };
  }, [
    nodesInitialized,
    reactFlow,
    request?.key,
    request?.nodeIds,
    request?.padding,
    request?.minZoom,
    request?.maxZoom,
    request?.centerNodeId,
    request?.focusZoom,
    request?.retryDelays,
  ]);

  return null;
}

function FlowCanvas({
  nodes,
  edges,
  nodeTypes,
  onInit,
  onNodeClick,
  onPaneClick,
  viewportRequest,
}) {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();
      setIsReady(width > 0 && height > 0);
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      const timer = window.setTimeout(updateSize, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[840px] w-full min-w-0 bg-[#050816]"
      style={{
        width: "100%",
        height: 840,
        minHeight: 840,
      }}
    >
      {nodes.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
          표시할 타입 노드가 없습니다.
        </div>
      ) : !isReady ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
          다이어그램 영역을 준비 중입니다.
        </div>
      ) : (
        <ReactFlow
          className="class-diagram-flow h-full w-full"
          style={{
            width: "100%",
            height: "100%",
          }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={onInit}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          fitView
          fitViewOptions={{
            padding: 0.12,
            minZoom: 0.06,
            maxZoom: 0.9,
          }}
          minZoom={0.06}
          maxZoom={1.5}
          elevateEdgesOnSelect={false}
          zIndexMode="manual"
          proOptions={{ hideAttribution: true }}
        >
          <ViewportController request={viewportRequest} />

          <Background gap={22} size={1} color="rgba(255,255,255,0.06)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      )}
    </div>
  );
}

function FocusSidePanel({
  entryPoints,
  extensionPoints,
  selectedNodeId,
  onFocusNode,
  onChangeFocusMode,
}) {
  return (
    <aside className="w-full shrink-0 border-t border-white/10 bg-[#070b18]/80 xl:w-[360px] xl:border-l xl:border-t-0">
      <div className="sticky top-0 max-h-[840px] overflow-y-auto p-5">
        <div>
          <h4 className="text-sm font-bold text-gray-100">진입점 / 확장점</h4>
          <p className="mt-1 text-xs text-gray-500">
            항목을 클릭하면 해당 클래스의 주변 관계만 바로 보여줍니다.
          </p>
        </div>

        <div className="mt-5">
          <PanelHeader
            title="진입점"
            count={entryPoints.length}
            colorClassName="text-purple-200"
            onClick={() => onChangeFocusMode(FOCUS_MODE.ENTRY_POINT)}
          />

          <div className="mt-2 space-y-2">
            {entryPoints.length === 0 ? (
              <EmptyPanelText text="진입점 후보가 없습니다." />
            ) : (
              entryPoints.map((node) => (
                <FocusListItem
                  key={`entry-${node.symbolId}`}
                  node={node}
                  selected={selectedNodeId === String(node.symbolId)}
                  accent="purple"
                  onClick={() => onFocusNode(node)}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-7">
          <PanelHeader
            title="확장점"
            count={extensionPoints.length}
            colorClassName="text-yellow-200"
            onClick={() => onChangeFocusMode(FOCUS_MODE.EXTENSION_POINT)}
          />

          <div className="mt-2 space-y-2">
            {extensionPoints.length === 0 ? (
              <EmptyPanelText text="확장점 후보가 없습니다." />
            ) : (
              extensionPoints.map((node) => (
                <FocusListItem
                  key={`extension-${node.symbolId}`}
                  node={node}
                  selected={selectedNodeId === String(node.symbolId)}
                  accent="yellow"
                  onClick={() => onFocusNode(node)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function PanelHeader({ title, count, colorClassName, onClick }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onClick}
        className={`text-sm font-semibold ${colorClassName} hover:underline`}
      >
        {title}
      </button>

      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-gray-400">
        {count}
      </span>
    </div>
  );
}

function EmptyPanelText({ text }) {
  return (
    <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-gray-500">
      {text}
    </p>
  );
}

function FocusListItem({ node, selected, accent, onClick }) {
  const borderClass =
    accent === "purple"
      ? "border-purple-400/25 hover:border-purple-300/60"
      : "border-yellow-400/25 hover:border-yellow-300/60";

  const selectedClass =
    accent === "purple"
      ? "border-purple-300 bg-purple-400/10"
      : "border-yellow-300 bg-yellow-400/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
        selected ? selectedClass : `${borderClass} bg-white/[0.025]`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-100">{node.label}</p>
          <p className="mt-1 text-xs text-gray-500">
            {shortPackageName(node.packageName)}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-400">
          {formatScore(node.score)}
        </span>
      </div>

      {node.badges?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {node.badges.slice(0, 3).map((badge) => (
            <span
              key={badge}
              className={`rounded-full border px-1.5 py-0.5 text-[10px] ${badgeClassName(
                badge
              )}`}
            >
              {badgeLabel(badge)}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-gray-100">{value}</p>
    </div>
  );
}

export default function ClassDiagramSection({
  classDiagram,
  loading = false,
  error = null,
}) {
  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState(
    DEFAULT_VISIBLE_EDGE_TYPES
  );
  const [layoutDirection, setLayoutDirection] = useState("TB");
  const [groupMode, setGroupMode] = useState(GROUP_MODE.PACKAGE);
  const [focusMode, setFocusMode] = useState(FOCUS_MODE.ALL);
  const [viewMode, setViewMode] = useState(VIEW_MODE.OVERVIEW);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [viewportRequest, setViewportRequest] = useState(null);

  const diagramNodes = classDiagram?.nodes ?? [];
  const diagramEdges = classDiagram?.edges ?? [];

  const entryPoints = useMemo(
    () =>
      diagramNodes
        .filter(isEntryPoint)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [diagramNodes]
  );

  const extensionPoints = useMemo(
    () =>
      diagramNodes
        .filter(isExtensionPoint)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [diagramNodes]
  );

  const searchResults = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return diagramNodes
      .filter((node) => {
        const label = node.label?.toLowerCase() ?? "";
        const qualifiedName = node.qualifiedName?.toLowerCase() ?? "";
        const packageName = node.packageName?.toLowerCase() ?? "";

        return (
          label.includes(keyword) ||
          qualifiedName.includes(keyword) ||
          packageName.includes(keyword)
        );
      })
      .sort((a, b) => {
        const aExact = a.label?.toLowerCase() === keyword ? 1 : 0;
        const bExact = b.label?.toLowerCase() === keyword ? 1 : 0;

        if (aExact !== bExact) {
          return bExact - aExact;
        }

        return (b.score ?? 0) - (a.score ?? 0);
      })
      .slice(0, 7);
  }, [diagramNodes, searchTerm]);

  const edgeTypeCounts = useMemo(() => {
    return diagramEdges.reduce(
      (acc, edge) => {
        acc[edge.edgeType] = (acc[edge.edgeType] ?? 0) + 1;
        return acc;
      },
      {
        EXTENDS: 0,
        IMPLEMENTS: 0,
        PARAM: 0,
        RETURNS: 0,
      }
    );
  }, [diagramEdges]);

  const {
    nodes,
    edges,
    groups,
    scopedNodes,
    scopedEdges,
    allVisibleEdges,
  } = useMemo(
    () =>
      buildGroupedLayout(
        diagramNodes,
        diagramEdges,
        visibleEdgeTypes,
        layoutDirection,
        groupMode,
        focusMode,
        viewMode,
        selectedNodeId
      ),
    [
      diagramNodes,
      diagramEdges,
      visibleEdgeTypes,
      layoutDirection,
      groupMode,
      focusMode,
      viewMode,
      selectedNodeId,
    ]
  );

  const selectedNode = useMemo(
    () =>
      diagramNodes.find((node) => String(node.symbolId) === selectedNodeId) ??
      null,
    [diagramNodes, selectedNodeId]
  );

  const groupCount = groups.length;
  const displayedEdgeCount = edges.length;
  const activeVisibleEdgeCount = allVisibleEdges.length;
  const totalEdgeCount =
    classDiagram?.summary?.selectedEdgeCount ?? diagramEdges.length;

  const requestFitView = useCallback((nodeIds, options = {}) => {
    setViewportRequest((prev) => ({
      key: (prev?.key ?? 0) + 1,
      nodeIds,
      padding: options.padding ?? 0.16,
      minZoom: options.minZoom ?? 0.08,
      maxZoom: options.maxZoom ?? 1.15,
      centerNodeId: options.centerNodeId ?? null,
      focusZoom: options.focusZoom ?? null,
      retryDelays: options.retryDelays ?? [],
    }));
  }, []);

  const fitOverview = useCallback(
    (duration = 500) => {
      if (!reactFlowInstance || nodes.length === 0) {
        return;
      }

      reactFlowInstance.fitView({
        padding: 0.12,
        duration,
        minZoom: 0.06,
        maxZoom: 0.9,
      });
    },
    [nodes.length, reactFlowInstance]
  );

  const fitNeighborhood = useCallback(
    (duration = 500) => {
      if (!reactFlowInstance || nodes.length === 0) {
        return;
      }

      reactFlowInstance.fitView({
        padding: nodes.length <= 5 ? 0.28 : 0.22,
        duration,
        minZoom: 0.06,
        maxZoom: 0.95,
      });
    },
    [nodes.length, reactFlowInstance]
  );

  useEffect(() => {
    if (nodes.length === 0) {
      return;
    }

    const classNodeIds = nodes
      .filter((node) => node.type === "umlClass")
      .map((node) => node.id);

    const allNodeIds = nodes.map((node) => node.id);

    if (viewMode === VIEW_MODE.NEIGHBORHOOD) {
      const targetIds = classNodeIds.length > 0 ? classNodeIds : allNodeIds;
      const targetCount = targetIds.length;

      requestFitView(targetIds, {
        padding: targetCount <= 5 ? 0.28 : 0.22,
        minZoom: 0.06,
        maxZoom: 0.95,
        retryDelays: [300, 900],
      });

      return;
    }

    if (focusMode === FOCUS_MODE.ENTRY_POINT && entryPoints.length > 0) {
      requestFitView(
        entryPoints.map((node) => String(node.symbolId)),
        {
          padding: 0.35,
          minZoom: 0.25,
          maxZoom: 1.05,
        }
      );

      return;
    }

    if (
      focusMode === FOCUS_MODE.EXTENSION_POINT &&
      extensionPoints.length > 0
    ) {
      requestFitView(
        extensionPoints.map((node) => String(node.symbolId)),
        {
          padding: 0.35,
          minZoom: 0.25,
          maxZoom: 1.05,
        }
      );

      return;
    }

    requestFitView(allNodeIds, {
      padding: 0.12,
      minZoom: 0.06,
      maxZoom: 0.9,
      retryDelays: [300, 900],
    });
  }, [
    nodes,
    viewMode,
    focusMode,
    entryPoints,
    extensionPoints,
    selectedNodeId,
    requestFitView,
  ]);

  useEffect(() => {
    if (
      viewMode !== VIEW_MODE.OVERVIEW ||
      focusMode !== FOCUS_MODE.ALL ||
      !reactFlowInstance ||
      nodes.length === 0
    ) {
      return;
    }

    const timers = [0, 250, 750, 1500].map((delay) =>
      window.setTimeout(() => fitOverview(delay === 0 ? 500 : 250), delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [fitOverview, focusMode, nodes.length, reactFlowInstance, viewMode]);

  useEffect(() => {
    if (
      viewMode !== VIEW_MODE.NEIGHBORHOOD ||
      !reactFlowInstance ||
      nodes.length === 0
    ) {
      return;
    }

    const timers = [0, 250, 750, 1500].map((delay) =>
      window.setTimeout(() => fitNeighborhood(delay === 0 ? 500 : 250), delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [fitNeighborhood, nodes.length, reactFlowInstance, selectedNodeId, viewMode]);

  const resetToOverview = useCallback(() => {
    setViewMode(VIEW_MODE.OVERVIEW);
    setSelectedNodeId(null);
    setFocusMode(FOCUS_MODE.ALL);
    setSearchTerm("");
  }, []);

  const enterNeighborhoodView = useCallback((node) => {
    const nodeId = String(node.symbolId);

    setSelectedNodeId(nodeId);
    setViewMode(VIEW_MODE.NEIGHBORHOOD);
    setFocusMode(FOCUS_MODE.ALL);
    setSearchTerm(node.label ?? "");
  }, []);

  const handleFocusNode = useCallback(
    (node) => {
      enterNeighborhoodView(node);
    },
    [enterNeighborhoodView]
  );

  const handleNodeClick = useCallback(
    (_, node) => {
      if (node.type !== "umlClass") {
        return;
      }

      const originalNode = diagramNodes.find(
        (item) => String(item.symbolId) === node.id
      );

      if (!originalNode) {
        return;
      }

      enterNeighborhoodView(originalNode);
    },
    [diagramNodes, enterNeighborhoodView]
  );

  const handlePaneClick = useCallback(() => {
    if (viewMode === VIEW_MODE.NEIGHBORHOOD) {
      resetToOverview();
    }
  }, [resetToOverview, viewMode]);

  const handleSearchSelect = useCallback(
    (node) => {
      enterNeighborhoodView(node);
    },
    [enterNeighborhoodView]
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchResults.length > 0) {
      enterNeighborhoodView(searchResults[0]);
    }
  }, [enterNeighborhoodView, searchResults]);

  const toggleEdgeType = (edgeType) => {
    setVisibleEdgeTypes((prev) => ({
      ...prev,
      [edgeType]: !prev[edgeType],
    }));
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-3 text-gray-300">
          <Loader2 size={20} className="animate-spin" />
          <span>클래스다이어그램을 생성하고 불러오는 중입니다.</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-500/20 bg-red-950/10 p-6">
        <div className="flex items-start gap-3">
          <TriangleAlert size={20} className="mt-0.5 text-red-300" />
          <div>
            <h3 className="font-semibold text-red-200">
              클래스다이어그램을 불러오지 못했습니다.
            </h3>
            <p className="mt-1 text-sm text-red-200/80">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!classDiagram) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-start gap-3">
          <Box size={20} className="mt-0.5 text-gray-400" />
          <div>
            <h3 className="font-semibold text-gray-200">
              아직 클래스다이어그램이 없습니다.
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              분석 완료 후 클래스 다이어그램이 표시됩니다.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch size={20} className="text-cyan-300" />
              <h3 className="text-xl font-bold text-gray-100">
                Class Diagram
              </h3>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {viewMode === VIEW_MODE.NEIGHBORHOOD && selectedNode
                ? `${selectedNode.label} 주변 관계만 다시 배치해서 보여주고 있습니다.`
                : groupMode === GROUP_MODE.PACKAGE
                  ? "실제 패키지 구조 기준으로 클래스를 묶어 보여줍니다."
                  : "패키지명과 클래스명을 기준으로 추론한 레이어 구조로 묶어 보여줍니다."}
            </p>

            <p className="mt-2 text-xs text-gray-600">
              현재 보기:{" "}
              {viewMode === VIEW_MODE.NEIGHBORHOOD ? "주변 보기" : "전체 구조"}{" "}
              / 모드: {groupMode === GROUP_MODE.PACKAGE ? "Package" : "Layer"}{" "}
              / 그룹: {groupCount}개 / 현재 표시 노드: {scopedNodes.length}개 /
              현재 표시 관계선: {displayedEdgeCount}개 / 활성 관계선:{" "}
              {activeVisibleEdgeCount}개 / 전체 관계선: {totalEdgeCount}개
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Nodes" value={scopedNodes.length} />
            <SummaryCard
              label={groupMode === GROUP_MODE.PACKAGE ? "Packages" : "Layers"}
              value={groupCount}
            />
            <SummaryCard label="Visible Edges" value={displayedEdgeCount} />
            <SummaryCard
              label="Candidates"
              value={classDiagram?.summary?.candidateTypeCount ?? "-"}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchBox
              searchTerm={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm("")}
              results={searchResults}
              onSelect={handleSearchSelect}
              onSubmit={handleSearchSubmit}
            />

            {viewMode === VIEW_MODE.NEIGHBORHOOD && (
              <button
                type="button"
                onClick={resetToOverview}
                className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15"
              >
                전체 구조로 돌아가기
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <FocusModeToggle
              value={focusMode}
              onChange={(mode) => {
                setViewMode(VIEW_MODE.OVERVIEW);
                setSelectedNodeId(null);
                setFocusMode(mode);
              }}
              entryPointCount={entryPoints.length}
              extensionPointCount={extensionPoints.length}
            />

            <GroupModeToggle value={groupMode} onChange={setGroupMode} />

            <LayoutToggle
              value={layoutDirection}
              onChange={setLayoutDirection}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {Object.keys(EDGE_META).map((edgeType) => (
            <EdgeToggle
              key={edgeType}
              edgeType={edgeType}
              checked={visibleEdgeTypes[edgeType]}
              count={edgeTypeCounts[edgeType] ?? 0}
              onChange={toggleEdgeType}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <LegendItem edgeType="EXTENDS" />
          <LegendItem edgeType="IMPLEMENTS" />
          <LegendItem edgeType="PARAM" />
          <LegendItem edgeType="RETURNS" />
        </div>
      </div>

      <div className="flex w-full flex-col xl:flex-row">
        <div className="w-full min-w-0 flex-1">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            viewportRequest={viewportRequest}
          />
        </div>

        <FocusSidePanel
          entryPoints={entryPoints}
          extensionPoints={extensionPoints}
          selectedNodeId={selectedNodeId}
          onFocusNode={handleFocusNode}
          onChangeFocusMode={(mode) => {
            setViewMode(VIEW_MODE.OVERVIEW);
            setSelectedNodeId(null);
            setFocusMode(mode);
          }}
        />
      </div>

      <div className="flex items-start gap-3 border-t border-white/10 px-6 py-4 text-sm text-gray-500">
        <Workflow size={17} className="mt-0.5 shrink-0" />
        <p>
          처음에는 전체 구조를 자동으로 맞춰 보여주고, 노드·검색 결과·진입점·확장점을
          선택하면 해당 타입의 직접 연결 관계만 자동 재배치해서 보여줍니다.
        </p>
      </div>
    </section>
  );
}
