#! /usr/bin/env perl
use strict;
my %pattern=('xvfb'=>3,'AvnavOchartsProvider'=>3,'opening'=>-1,'closing'=>-1);
my %counts;
my $lasttime="";
sub getKeys(){
	return sort(keys(%pattern));
}
foreach my $c (keys(%pattern)){
	$counts{$c}=0;
}
print "time\t";
foreach my $c (getKeys()){
	print "$c\t";
}
print "\n";
while(<>){
	my @x=split(/[ -]+/);
	my $time="$x[0]-$x[1]";
	foreach my $c (getKeys()){
		if ($_ =~ /$c/i){
			#print "###match $c in $_\n";
			my $f=$pattern{$c};
			if ($f < 0){
				$counts{$c}+=1;
			}
			else{
				$counts{$c}=$x[$f];
			}
		}
	}
	if ( $time ne $lasttime){
		print "$time\t";
		foreach my $c (getKeys()){
			print "$counts{$c}\t";
		}
		print "\n";
		$lasttime=$time;
	}
}
