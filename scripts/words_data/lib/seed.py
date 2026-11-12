import hashlib
from collections.abc import Sequence
from typing import TypeVar

MASK32 = 0xFFFFFFFF
T = TypeVar("T")


class Mulberry32:
    """The same 32-bit PRNG used by the browser runtime."""

    def __init__(self, seed: int) -> None:
        self._state = seed & MASK32

    def next(self) -> float:
        self._state = (self._state + 0x6D2B79F5) & MASK32
        t = self._state
        t = ((t ^ (t >> 15)) * (t | 1)) & MASK32
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & MASK32)) & MASK32
        return ((t ^ (t >> 14)) & MASK32) / 4294967296.0


def seed_from_label(label: str) -> int:
    """Use the first 32 bits of SHA-256 so the seed is stable across languages."""
    return int.from_bytes(hashlib.sha256(label.encode("utf-8")).digest()[:4], "big")


def shuffled(items: Sequence[T], label: str) -> list[T]:
    """Fisher-Yates shuffle driven by mulberry32."""
    result = list(items)
    rng = Mulberry32(seed_from_label(label))
    for i in range(len(result) - 1, 0, -1):
        j = int(rng.next() * (i + 1))
        result[i], result[j] = result[j], result[i]
    return result
