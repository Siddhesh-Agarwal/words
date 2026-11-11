from collections import defaultdict, deque
from collections.abc import Iterable, Mapping, Sequence
from typing import TypeVar

T = TypeVar("T")
Graph = dict[str, set[str]]


def build_graph(words: Iterable[str]) -> Graph:
    """Connect words that differ in exactly one letter."""
    ordered = sorted(set(words))
    buckets: dict[str, list[str]] = defaultdict(list)
    for word in ordered:
        for index in range(len(word)):
            pattern = word[:index] + "*" + word[index + 1 :]
            buckets[pattern].append(word)

    graph: Graph = {word: set() for word in ordered}
    for bucket in buckets.values():
        for index, left in enumerate(bucket):
            for right in bucket[index + 1 :]:
                graph[left].add(right)
                graph[right].add(left)
    return graph


def largest_component(graph: Mapping[str, set[str]]) -> set[str]:
    visited: set[str] = set()
    best: set[str] = set()
    for start in sorted(graph):
        if start in visited:
            continue
        component: set[str] = set()
        stack = [start]
        visited.add(start)
        while stack:
            node = stack.pop()
            component.add(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    stack.append(neighbor)
        if len(component) > len(best):
            best = component
    return best


def shortest_distances(
    graph: Mapping[str, set[str]], start: str, max_depth: int = 7
) -> dict[str, int]:
    if start not in graph:
        return {}
    distances = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        if distances[node] >= max_depth:
            continue
        for neighbor in graph[node]:
            if neighbor not in distances:
                distances[neighbor] = distances[node] + 1
                queue.append(neighbor)
    return distances


def candidate_pairs(
    graph: Mapping[str, set[str]],
    endpoints: Iterable[str],
    min_par: int = 4,
    max_par: int = 7,
) -> list[tuple[str, str, int]]:
    """Return each unordered endpoint pair once, with its shortest-path length."""
    endpoint_set = set(endpoints) & set(graph)
    pairs: list[tuple[str, str, int]] = []
    for start in sorted(endpoint_set):
        distances = shortest_distances(graph, start, max_depth=max_par)
        for end, distance in distances.items():
            if start < end and end in endpoint_set and min_par <= distance <= max_par:
                pairs.append((start, end, distance))
    pairs.sort()
    return pairs


def chunked(items: Sequence[T], size: int) -> list[list[T]]:
    values = list(items)
    return [values[index : index + size] for index in range(0, len(values), size)]
