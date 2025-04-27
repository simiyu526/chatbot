interface BlockNoticeProps {
    blockTimeLeft: number;
  }
  
  export default function BlockNotice({ blockTimeLeft }: BlockNoticeProps) {
    return (
      <div className="bg-red-100 text-red-700 text-center text-sm p-2">
        You are blocked. Try again in {Math.ceil(blockTimeLeft / 60000)} minutes.
      </div>
    );
  }
  