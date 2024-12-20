"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Candidate {
  name: string;
  votes: bigint;
}

interface Winner {
  winnerIndex: bigint;
  winnerVotes: bigint;
}

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const [newCandidate, setNewCandidate] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const { data: ownerData } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "owner",
  });

  const { data: allCandidatesData, isLoading: isCandidatesLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getAllCandidates",
    watch: true,
  });

  const { data: winnerData, isLoading: isWinnerLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getWinner",
    watch: true,
  });

  const { writeContractAsync: addCandidateAsync, isMining: isAdding } = useScaffoldWriteContract("YourContract");
  const { writeContractAsync: voteAsync, isMining: isVoting } = useScaffoldWriteContract("YourContract");

  useEffect(() => {
    if (ownerData && connectedAddress) {
      setIsOwner(ownerData.toLowerCase() === connectedAddress.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [ownerData, connectedAddress]);

  useEffect(() => {
    if (allCandidatesData) {
      const fetchedCandidates: Candidate[] = (allCandidatesData as readonly { name: string; votes: bigint }[]).map(
        candidate => ({
          name: candidate.name,
          votes: candidate.votes,
        }),
      );
      setCandidates(fetchedCandidates);
    }
  }, [allCandidatesData]);

  useEffect(() => {
    console.log(winnerData);
    if (winnerData) {
      console.log(winnerData);
      const [winnerIndex, winnerVotes] = winnerData as [bigint, bigint];
      console.log(winnerIndex, winnerVotes);
      setWinner({
        winnerIndex,
        winnerVotes,
      });
    }
  }, [winnerData]);

  const handleAddCandidate = async () => {
    if (!newCandidate) return;
    try {
      await addCandidateAsync({
        functionName: "addCandidate",
        args: [newCandidate],
      });
      setNewCandidate("");
    } catch (e) {
      console.error("Ошибка при добавлении кандидата:", e);
    }
  };

  const handleVote = async () => {
    if (selectedCandidate === null) return;
    try {
      await voteAsync({
        functionName: "vote",
        args: [BigInt(selectedCandidate)],
      });
      setSelectedCandidate(null);
    } catch (e) {
      console.error("Ошибка при голосовании:", e);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Добро пожаловать</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Подключенный адрес:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        {isOwner && (
          <div className="mt-8 w-full max-w-md">
            <h2 className="font-bold leading-snug tracking-normal text-slate-800 mx-auto my-6 w-full text-2xl lg:max-w-3xl lg:text-4xl">
              Добавить Кандидата для голосования
            </h2>
            <input
              type="text"
              value={newCandidate}
              onChange={e => setNewCandidate(e.target.value)}
              className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
              placeholder="Введите имя кандидата"
            />
            <button className="btn btn-primary w-full" onClick={handleAddCandidate} disabled={isAdding}>
              {isAdding ? "Добавление..." : "Добавить Кандидата"}
            </button>
          </div>
        )}

        <div className="mt-16 w-full max-w-2xl">
          <h2 className="text-2xl mb-4">Кандидаты</h2>
          {isCandidatesLoading ? (
            <p>Загрузка кандидатов...</p>
          ) : candidates.length > 0 ? (
            <ul className="list-disc list-inside">
              {candidates.map((candidate, index) => (
                <li key={index} className="flex justify-between items-center my-2">
                  <span>
                    {index}. {candidate.name} — {candidate.votes.toString()} голосов
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedCandidate(index)}
                    disabled={isVoting}
                  >
                    {isVoting && selectedCandidate === index ? "Голосование..." : "Голосовать"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Кандидаты отсутствуют.</p>
          )}
          {selectedCandidate !== null && (
            <button className="btn btn-primary mt-4" onClick={handleVote} disabled={isVoting}>
              {isVoting ? "Голосование..." : "Подтвердить Голос"}
            </button>
          )}
        </div>

        <div className="mt-16 w-full max-w-md">
          <h2 className="text-2xl mb-4">Текущий Победитель</h2>
          {isWinnerLoading ? (
            <p>Загрузка победителя...</p>
          ) : winner ? (
            <p>
              Индекс: {winner.winnerIndex.toString()}, Голосов: {winner.winnerVotes.toString()}
            </p>
          ) : (
            <p>Победитель еще не определен.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
