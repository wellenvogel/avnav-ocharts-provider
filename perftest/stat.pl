#! /usr/bin/env perl
use strict;

my %stat=();
my $count=0;
while (<>){
	next if ($_ !~ /render=/);
	chomp;
        my $prfx="";
	$prfx="http-" if ($_ =~ /http/);
	s/.*find=/find=/;
	s/.*http render: //;
	my @x=split(/ *, */);
	$count++ if ($prfx eq "http-");
	foreach my $e (@x){
		my @nv=split(/=/,$e);
		my $k=$prfx.$nv[0];
		if  (! $stat{$k}) {
			$stat{$k}=$nv[1];
		}
		else{
			$stat{$k}+=$nv[1];
		}
	}
}
print "count=$count\n";
foreach my $k (sort(keys(%stat))){
	print "$k\t=".($stat{$k}/$count)."\n";
}
