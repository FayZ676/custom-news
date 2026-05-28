from typing import Protocol, runtime_checkable


class RampExhausted(Exception):
    """Raised by slow_down() when the ramp is already at its minimum step."""


@runtime_checkable
class RampStrategy(Protocol):
    """Stateful ramp strategy. ``current`` is the desired wave size;
    ``speed_up`` advances after a successful wave; ``slow_down`` retreats
    on headroom exhaustion, raising ``RampExhausted`` if already at minimum.
    """

    @property
    def current(self) -> int: ...

    def speed_up(self) -> None: ...

    def slow_down(self) -> None: ...


class Fibonacci:
    """Ramp strategy whose wave sizes follow the Fibonacci sequence (1, 1, 2, 3, 5, 8, …).

    A moderate-growth default — faster than linear, slower than exponential.
    """

    def __init__(self) -> None:
        self._step = 0

    @property
    def current(self) -> int:
        a, b = 1, 1
        for _ in range(self._step):
            a, b = b, a + b
        return a

    def speed_up(self) -> None:
        self._step += 1

    def slow_down(self) -> None:
        if self._step == 0:
            raise RampExhausted(
                "Ramp is already at minimum step (wave size 1) and cannot slow down further."
            )
        self._step -= 1
